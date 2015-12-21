/*
====================================
====================================
 config
====================================
====================================
*/

if (Meteor.isServer) {
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
}


AccountsGuest.enabled = true;
AccountsGuest.forced = true;
AccountsGuest.name = true;

SimpleSchema.debug = true



/*
====================================
====================================
 Collections
====================================
====================================
*/

SwapReceipts = new Mongo.Collection("swap_receipts");
SwapOffers = new Mongo.Collection("swap_offers");
TransactionHistory = new Mongo.Collection("transaction_history");

if (Meteor.isServer) {
    SwapReceipts._ensureIndex({ "offeredBy": 1});
    SwapOffers._ensureIndex({ "offeredBy": 1});
}

var Schemas = {};

Schemas.SwapReceipt = new SimpleSchema({
    "swappedAt": {
        type: Date,
        autoValue: function () {
            return new Date();
        },
        label: "Time swap receipt was created"
    },
    "offeredAt": {
        type: Date,
        label: "Time swap offer was created"
    },
    "offeredBy": {
        type: String,
        label: "ID of user who created swap offer"
    },
    "offerId": {
        type: String,
        label: "ID of swap offer"
    },
    "value": {
        type: Number,
        decimal: true,
        label: "Value of swap offer"
    },
    "completed": {
        type: Boolean,
        label: "Whether swap has been paid"
    },
    "cancelled": {
        type: Boolean,
        label: "Whether swap was cancelled",
        optional: true
    },
    "swapped_with": {
        type: String,
        label: "ID of associated swap receipt",
        optional: true
    }

})

Schemas.SwapOffer = new SimpleSchema({
    "offeredAt": {
        type: Date,
        autoValue: function () {
            return new Date();
        },
        label: "Time swap offer was created"
    },
    "offeredBy": {
        type: String,
        autoValue: function () {
            return this.userId
        },
        label: "ID of user who created swap offer"
    },
    "value": {
        type: Number,
        label: "Value of swap offer",
        autoValue: function () {
            var amtInUSD = Math.round( (Math.random() * 10) * 1e2 ) / 1e2; // get random num between 1-10
            return amtInUSD;
        },
        decimal: true
    },
    "completed": {
        type: Boolean,
        label: "Whether swap has been paid"
    }

});

SwapReceipts.attachSchema(Schemas.SwapReceipt);
SwapOffers.attachSchema(Schemas.SwapOffer);

/*
====================================
====================================
 Routes
====================================
====================================
*/

FlowRouter.route("/", {
    name: "home",
    action: function () {
        BlazeLayout.render("MainLayout", {
            content: "startSwap"
        })
    }
})

FlowRouter.route("/swapping/:swapId", {
    name: "swapInProgress",
    action: function () {
        BlazeLayout.render("MainLayout", {
            content: "swapping"
        })
    }
})

FlowRouter.route("/swap/:swapId", {
    name: "swapReceipt",
    action: function () {
        BlazeLayout.render("MainLayout", {
            content: "swapReceipt"
        })
    }
})



/*
====================================
====================================
 Client stuff
====================================
====================================
*/

if (Meteor.isClient) {

    Template.adminTools.events({
        'click #current_user': function () {
            console.log(Meteor.user())
        },
        'click #get_accounts': function () {
            Meteor.call("getAccounts")
        },
        'click #get_transactions': function () {
            Meteor.call("getTransactionHistory")
        }
    });


  Template.startSwap.helpers({
    address: function () {
        if (Meteor.user()) {
            if (Meteor.user().profile.bitcoin_address) return Meteor.user().profile.bitcoin_address
        }
    },
    swapInProgress: function () {
        var offerId = Session.get("currentOffer");
        var receipt = Session.get("currentReceipt") || SwapReceipts.findOne({"offerId": offerId});
        if (offerId && !receipt) return offerId;
    },
    swapCompleted: function () {
        var offerId = Session.get("currentOffer");
        var receipt = Session.get("currentReceipt") || SwapReceipts.findOne({"offerId": offerId});
        if (offerId && receipt && receipt.offerId) {
            if (receipt.offerId == offerId) return receipt._id;
        }
    }
  });

  Template.startSwap.events({
    'click button': function () {
      // increment the counter when button is clicked
      var address = $("input").val();
      console.log(address)

      if (!Meteor.user().profile.bitcoin_address) {
          var id = Meteor.userId();
          Meteor.users.update(id, {$set: {"profile.bitcoin_address": address}})
      }

      var swap_in_progress = Session.get("currentOffer");

      if (!swap_in_progress) {
          SwapOffers.insert({completed:false}, function (err,id) {
              FlowRouter.go("/swapping/" + id)
              Session.set("currentOffer", id);
          })
      } else if (swap_in_progress) {
          FlowRouter.go("/swapping/" + swap_in_progress._id)
      }


    }
  });

  Template.swapping.helpers({
      "swapOffer": function () {
          var offerId = Session.get("currentOffer") || SwapOffers.findOne(FlowRouter.getParam("swapId"));
          var receipt = Session.get("currentReceipt");
          if (offerId && !receipt) {
              var offer = SwapOffers.findOne(offerId);
              if (offer) return offer;
          } else if (offerId && receipt && receipt.offerId) {
              if (offerId == receipt.offerId) return FlowRouter.go("/swap/"+receipt._id)
          }
      }
  })

  Template.swapping.onRendered(function () {

      Meteor.call("getExchange", "USD", function (err,res) {
          if (res.data.rates.BTC) Session.set("amtBTC", res.data.rates.BTC);
      })

      var self = this;
      var loadedTime = new Date();
      var offerId = FlowRouter.getParam("swapId");
      if (offerId) {
          var receipts = SwapReceipts.find({"offerId": offerId}).observe({
              added: function (receipt) {
                  if (FlowRouter.getParam("swapId") && offerId == receipt.offerId) {
                      Session.set("currentReceipt", receipt)
                      receipts.stop()
                      return FlowRouter.go("/swap/"+receipt._id)
                  } else if (!FlowRouter.getParam("swapId")) {
                      receipts.stop()
                  }
              }
          });
      }

  })

  Template.swapping.events({
      "click .cancel-swap": function () {
          var swap = this;
          swap.cancelled = true;
          swap.offerId = swap._id;
          delete swap._id;
          SwapReceipts.insert(swap, function () {
              SwapOffers.remove(swap.offerId);
              FlowRouter.go("/")
          });
      }
  })

  Template.swapReceipt.onRendered(function () {
      Session.set("currentReceipt", false);
      Session.set("currentOffer", false);
  })

  Template.swapReceipt.helpers({
      "receipt": function () {
          return SwapReceipts.findOne(FlowRouter.getParam("swapId"))
      },
      "received_value": function (id) {
          var receipt = SwapReceipts.findOne(id);
          if (receipt) return receipt.value
      }
  })


  Template.requestPayment.helpers({

      "amtBTC": function () {
          return Session.get("amtBTC")*Template.instance().data.value;
      },
      "fullBitcoinAddress": function (amt, id) {
          var btc = amt*Session.get("amtBTC")
          return "bitcoin:mvfFfHvzxsbBvTDjWGJ9N6qmWCqfGp65tq?amount="+btc+"&description="+id;
      }

  })

}

/*
====================================
====================================
 Server stuff
====================================
====================================
*/

if (Meteor.isServer) {

    chalk.enabled = true;

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

                                                Meteor.call("sendBitcoin", btcForUser2, user2.profile.bitcoin_address, function (err,res) {
                                                    if (err) console.log(err);
                                                    console.log("payment for user 2 sent")
                                                })
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

    SwapOffers.find().observe({
        "added": function (offer) {
            makeMatch(offer);
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

}


/*
====================================
====================================
 Methods
====================================
====================================
*/


Meteor.methods({

})

if (Meteor.isServer) {
    Meteor.methods({
        "getAccounts": function () {
            client.getAccounts({}, function(err, accounts) {
              console.log(accounts)
            });
        },
        "sendBitcoin": function (originalAmt, address) {
            check(originalAmt, Number)
            var amtBtc = originalAmt;
            console.log("sending " + amtBtc + " BTC");
            client.getAccount('790a703c-7de7-522e-9c9d-027b15292a73', function(err, account) {
              account.sendMoney({'to': address,
                                 'amount': amtBtc,
                                 'description': 'Thanks for using Swapcoin!',
                                 'currency': 'BTC'}, function (tx) {
                                     console.log("===========");
                                     console.log(tx);
                                     console.log("===========");
                                 });
            });
        },

        "getTransactionHistory": function () {
            var getLatestTransactionHistory = new Future();

            client.getAccount('790a703c-7de7-522e-9c9d-027b15292a73', function(err, account) {
                account.getTransactions(null, function(err, txs) { // null will return all history instead of just one ID
                    getLatestTransactionHistory.return(txs);
                });
            });

            return getLatestTransactionHistory.wait();
        },

        "getExchange": function (ex) {
            var getExchangeFuture = new Future();

            client.getExchangeRates({"currency": ex}, function (err,rates) {
                getExchangeFuture.return(rates);
            })

            return getExchangeFuture.wait();
        }
    })
}
