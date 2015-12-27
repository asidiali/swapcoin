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
