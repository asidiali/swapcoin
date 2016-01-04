
Template.startSwap.helpers({
    address: function () {
        if (Meteor.user()) {
            if (Meteor.user().profile.bitcoin_address) return Meteor.user().profile.bitcoin_address
        }
    },
    swapInProgress: function () {
        var offer = Offers.findOne({"offered_by": Meteor.userId()});
        if (offer) {
            var receipt = Receipts.findOne({"offer_id": offer._id});
        }
        if (offer && offer._id && !receipt) return offer._id;
    },
    swapCompleted: function () {
        var offerId = Session.get("currentOffer");
        var receipt = Session.get("currentReceipt") || Receipts.findOne({"offer_id": offerId});
        if (offerId && receipt && receipt.offer_id) {
            if (receipt.offer_id == offerId) return receipt._id;
        }
    }
});

Template.startSwap.events({
  'click button': function () {

    var address = $("input").val();
    console.log(address)

    if (!Meteor.user().profile.bitcoin_address) {
        var id = Meteor.userId();
        Meteor.users.update(id, {$set: {"profile.bitcoin_address": address}})
    }

    var swap_in_progress = Session.get("currentOffer");

    if (!swap_in_progress) {
        Offers.insert({ paid:false }, function (err,id) {
            FlowRouter.go("/swapping/" + id)
            Session.set("currentOffer", id);
        })
    } else if (swap_in_progress) {
        FlowRouter.go("/swapping/" + swap_in_progress._id)
    }


  }
});
