Template.swapping.helpers({
    "swapOffer": function () {
        var offerId = Session.get("currentOffer") || Offers.findOne(FlowRouter.getParam("offerId"));
        var receipt = Session.get("currentReceipt");
        if (offerId && !receipt) {
            var offer = Offers.findOne(offerId);
            if (offer) return offer;
        } else if (offerId && receipt && receipt.offer_id) {
            if (offerId == receipt.offer_id) return FlowRouter.go("/swap/"+receipt._id)
        }
    },
    "amtBTC": function () {
        return Session.get("amtBTC")*Template.instance().data.value;
    },
    "fullBitcoinAddress": function (amt, id) {
        var btc = amt*Session.get("amtBTC")
        return "bitcoin:mvfFfHvzxsbBvTDjWGJ9N6qmWCqfGp65tq?amount="+btc+"&description="+id;
    }
})

Template.swapping.onRendered(function () {

    Meteor.call("getExchange", "USD", function (err,res) {
        if (res.data.rates.BTC) Session.set("amtBTC", res.data.rates.BTC);
    })

    var self = this;
    var loadedTime = new Date();
    var offerId = FlowRouter.getParam("offerId");
    if (offerId) {
        var receipts = Receipts.find({"offer_id": offerId}).observe({
            added: function (receipt) {
                if (FlowRouter.getParam("offerId") && offerId == receipt.offer_id) {
                    Session.set("currentReceipt", receipt)
                    receipts.stop()
                    return FlowRouter.go("/swap/"+receipt._id)
                } else if (!FlowRouter.getParam("offerId")) {
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
        swap.offer_id = swap._id;
        delete swap._id;
        Receipts.insert(swap, function () {
            Offers.remove(swap.offer_id);
            FlowRouter.go("/")
        });
    }
})
