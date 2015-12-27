AccountsGuest.enabled = true;
AccountsGuest.forced = true;
AccountsGuest.name = true;

SimpleSchema.debug = true;


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

/*
====================================
====================================
 Methods
====================================
====================================
*/


if (Meteor.isServer) {

}
