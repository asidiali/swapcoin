FlowRouter.route("/", {
    name: "home",
    action: function () {
        BlazeLayout.render("MainLayout", {
            content: "startSwap"
        })
    }
})

FlowRouter.route("/swapping/:offerId", {
    name: "swapInProgress",
    action: function () {
        BlazeLayout.render("MainLayout", {
            content: "swapping"
        })
    }
})

FlowRouter.route("/swap/:receiptId", {
    name: "swapReceipt",
    action: function () {
        BlazeLayout.render("MainLayout", {
            content: "swapReceipt"
        })
    }
})
