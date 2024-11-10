import mongoose, { Schema } from "mongoose";

const UserProfileSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
        },
        location: {
            type: String,
        } ,
        experience: {
            type: String,
        },
        farmSize: {
            type: String,
        },
        primaryCrops: {
            type: [String],
        },
        certifications: {
            type: [String],
        },
        lastSoilTest: {
            type: String,
        },
        activeSubscription: {
            type: String,
        },
        soilHealth: {
            type: Number,
        },
        waterEfficiency: {
            type: Number,
        },
        yieldForecast: {
            type: Number,
        },
        sustainability: {
            type: Number,
        },
        recentActivities: [
            {
                date: {
                    type: String,
                },
                activity: {
                    type: String,
                },
                status: {
                    type: String,
                },
            },
        ],
        equipment: [
            {
                name: {
                    type: String,
                },
                status: {
                    type: String,
                },
                lastMaintenance: {
                    type: String,
                },
            },
        ],
    },
    { timestamps: true }
);

export const UserProfile = mongoose.model("UserProfile", UserProfileSchema);
