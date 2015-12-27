
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
