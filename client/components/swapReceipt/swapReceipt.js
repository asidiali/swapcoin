Template.swapReceipt.onRendered(function () {
    Session.set("currentReceipt", false);
    Session.set("currentOffer", false);
})

Template.swapReceipt.helpers({
    "receipt": function () {
        return Receipts.findOne(FlowRouter.getParam("receiptId"))
    },
    "received_value": function (id) {
        var receipt = Receipts.findOne(id);
        if (receipt) return receipt.value
    }
})
