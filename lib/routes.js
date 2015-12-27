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
