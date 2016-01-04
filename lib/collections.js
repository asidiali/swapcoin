Receipts = new Mongo.Collection("swap_receipts");
Offers = new Mongo.Collection("swap_offers");
Swaps = new Mongo.Collection("swap_history")
Transactions = new Mongo.Collection("transaction_history");

if (Meteor.isServer) {
    Receipts._ensureIndex({ "offered_by": 1});
    Offers._ensureIndex({ "offered_by": 1});
    // Transactions._ensureIndex({ "created_at": 1});
}

var Schemas = {};

Schemas.Receipt = new SimpleSchema({
    "created_at": {
        type: Date,
        autoValue: function () {
            return new Date();
        },
        label: "Time swap receipt was created"
    },
    "offered_at": {
        type: Date,
        label: "Time swap offer was created"
    },
    "offered_by": {
        type: String,
        label: "ID of user who created swap offer"
    },
    "offer_id": {
        type: String,
        label: "ID of swap offer"
    },
    "value": {
        type: Number,
        decimal: true,
        label: "Value of swap offer"
    },
    "paid": {
        type: Boolean,
        label: "Whether offer has been paid"
    },
    "cancelled": {
        type: Boolean,
        label: "Whether offer was cancelled",
        optional: true
    },
    "swap_id": {
        type: String,
        label: "ID of swap",
        optional: true
    }

})

Schemas.Offer = new SimpleSchema({
    "offered_at": {
        type: Date,
        autoValue: function () {
            return new Date();
        },
        label: "Time swap offer was created"
    },
    "offered_by": {
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
    "paid": {
        type: Boolean,
        label: "Whether offer has been paid"
    }

});

Receipts.attachSchema(Schemas.Receipt);
Offers.attachSchema(Schemas.Offer);
