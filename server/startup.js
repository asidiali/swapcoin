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

    Offers.find().observe({
        "added": function (offer) {
            console.log("offer #" + offer._id + " available")
        },

        "changed": function (newDoc, oldDoc) {
            if (newDoc.paid) makeMatch(newDoc);
        },

        "removed": function () {
            console.log("offer removed");
        }
    })

    // check every 3 seconds for new transactions from coinbase
    var importTxns = Meteor.setInterval(function () {
        Meteor.call("getTransactions", function (err,txns) {
            var newTxns = false;
            _.each(txns, function (txn) {
                var savedtxn = Transactions.findOne({transaction_id: txn.id});
                if (!savedtxn) {
                    newTxns = true;
                    var newtxn = txn;
                    newtxn["transaction_id"] = txn.id;
                    delete newtxn.id;
                    Transactions.insert(newtxn, function (err, id) {
                        console.log("added txn history ID " + id + " for txn " + newtxn.transaction_id)
                    })
                }
            })
            if (!newTxns) console.log(chalk.blue("No new transactions."))
        })
    }, 5000)


});


/*
====================================
====================================
 server functions
====================================
====================================
*/


var createReceipt = function (offer, callback) {
    offer.offer_id = offer._id; // save original offer id before stripping it from offer obj
    delete offer._id;
    console.log("creating receipt for offer:" + offer.offer_id)
    Receipts.insert(offer, function (err,id) {
        if (err) { console.log(err) }
        console.log("new receipt: " + id)
        callback(id);
    })
}


var makeMatch = function (offer) {
    if (Offers.find({ "_id": { $ne: offer._id }, "paid": true }).count() > 0) {
        console.log("offers available")
        var match = Offers.findOne({"_id": {$ne: offer._id}});
        if (offer && match) {
            var offerId = offer._id;
            var matchId = match._id;
            createReceipt(offer, function (offerReceiptId) {
                createReceipt(match, function (matchReceiptId) {
                    Receipts.update(offerReceiptId, {$set: {swap_id: matchReceiptId}}, function () {
                        Offers.remove(offerId);
                        Receipts.update(matchReceiptId, {$set: {swap_id: offerReceiptId}}, function () {
                            Offers.remove(matchId);

                            // both offers have been removed, time to send payments and mark receipts as paid
                            var user1 = Meteor.users.findOne(offer.offered_by);
                            var user2 = Meteor.users.findOne(match.offered_by);


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
