Meteor.startup( function () {

    chalk = Meteor.npmRequire( 'chalk' );
    Coinbase = Meteor.npmRequire( 'coinbase' );
    Future = Meteor.npmRequire('fibers/future');

    var Client = Coinbase.Client;

    client = new Client({
        'apiKey': 'e7k3txGezcpvMqss',
        'apiSecret': 'UmgS99RwjuCu4pc3zoyfkY5JWCXmnaxn',
        'baseApiUri': 'https://api.sandbox.coinbase.com/v2/',
        'tokenUri': 'https://api.sandbox.coinbase.com/oauth/token'
    });

    chalk.enabled = true;

    SwapOffers.find().observe({
        "added": function (offer) {
            console.log("offer #" + offer._id + " available")
        },

        "changed": function (newDoc, oldDoc) {
            if (newDoc.completed) makeMatch(newDoc);
        },

        "removed": function () {
            console.log("offer removed");
        }
    })

    // check every 3 seconds for new transactions from coinbase
    var importTxns = Meteor.setInterval(function () {
        Meteor.call("getTransactionHistory", function (err,txns) {
            var newTxns = false;
            _.each(txns, function (txn) {
                var savedtxn = TransactionHistory.findOne({transaction_id: txn.id});
                if (!savedtxn) {
                    newTxns = true;
                    var newtxn = txn;
                    newtxn["transaction_id"] = txn.id;
                    delete newtxn.id;
                    TransactionHistory.insert(newtxn, function (err, id) {
                        console.log("added txn history ID " + id + " for txn " + newtxn.transaction_id)
                    })
                }
            })
            if (!newTxns) console.log(chalk.green("No new transactions."))
        })
    }, 3000)


});


/*
====================================
====================================
 server functions
====================================
====================================
*/


var createReceipt = function (offer, callback) {
    offer.offerId = offer._id;
    delete offer._id;
    console.log("creating receipt for offer:" + offer.offerId)
    SwapReceipts.insert(offer, function (err,id) {
        if (err) { console.log(err) }
        console.log("new receipt: " + id)
        callback(id);
    })
}


var makeMatch = function (offer) {
    if (SwapOffers.find({"_id": {$ne: offer._id}}).count() > 0) {
        console.log("offers available")
        var match = SwapOffers.findOne({"_id": {$ne: offer._id}});
        if (offer && match) {
            var offerId = offer._id;
            var matchId = match._id;
            createReceipt(offer, function (offerReceiptId) {
                createReceipt(match, function (matchReceiptId) {
                    SwapReceipts.update(offerReceiptId, {$set: {swapped_with: matchReceiptId}}, function () {
                        SwapOffers.remove(offerId);
                        SwapReceipts.update(matchReceiptId, {$set: {swapped_with: offerReceiptId}}, function () {
                            SwapOffers.remove(matchId);

                            // both offers have been removed, time to send payments and mark receipts as paid
                            var user1 = Meteor.users.findOne(offer.offeredBy);
                            var user2 = Meteor.users.findOne(match.offeredBy);


                            var exchange_rate;

                            Meteor.call("getExchange", "USD", function (err,res) {
                                if (res.data.rates.BTC) {
                                    exchange_rate = res.data.rates.BTC;
                                    if (user1 && user2 && exchange_rate) {

                                        console.log("btc address for user 1: " + user1.profile.bitcoin_address)
                                        console.log("btc address for user 2: " + user2.profile.bitcoin_address)
                                        console.log("exchange rate at "+ exchange_rate)

                                        var btcForUser1 = match.value*exchange_rate*10;
                                        var btcForUser2 = offer.value*exchange_rate*10;

                                        Meteor.call("sendBitcoin", btcForUser1, user1.profile.bitcoin_address, function (err,res) {
                                            if (err) console.log(err);
                                            console.log("payment for user 1 sent")
                                        })

                                        Meteor.call("sendBitcoin", btcForUser2, user2.profile.bitcoin_address, function (err,res) {
                                            if (err) console.log(err);
                                            console.log("payment for user 2 sent")
                                        })

                                    }
                                }

                            })



                        })
                    })
                })
            })
        }
    }
}
