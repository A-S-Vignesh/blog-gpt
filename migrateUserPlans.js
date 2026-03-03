"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var User_1 = require("./src/models/User");
var MONGODB_URI = "mongodb+srv://vignesh:admin01@cluster.m8sqahv.mongodb.net/blog?retryWrites=true&w=majority&appName=cluster";
function migrateUserPlans() {
    return __awaiter(this, void 0, void 0, function () {
        var updated, users, _i, users_1, user, updateFields, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, 8, 10]);
                    return [4 /*yield*/, mongoose_1.default.connect(MONGODB_URI)];
                case 1:
                    _a.sent();
                    console.log("✅ Connected to MongoDB");
                    updated = 0;
                    return [4 /*yield*/, User_1.User.find({}).lean()];
                case 2:
                    users = _a.sent();
                    _i = 0, users_1 = users;
                    _a.label = 3;
                case 3:
                    if (!(_i < users_1.length)) return [3 /*break*/, 6];
                    user = users_1[_i];
                    updateFields = {};
                    if (!("plan" in user))
                        updateFields.plan = "free";
                    if (!("planStatus" in user))
                        updateFields.planStatus = "active";
                    if (!("aiGenerationCount" in user))
                        updateFields.aiGenerationCount = 0;
                    if (!("aiExtraCredits" in user))
                        updateFields.aiExtraCredits = 0;
                    if (!("aiUsagePeriodStart" in user))
                        updateFields.aiUsagePeriodStart = new Date();
                    if (!(Object.keys(updateFields).length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, User_1.User.updateOne({ _id: user._id }, { $set: updateFields })];
                case 4:
                    _a.sent();
                    updated++;
                    console.log("\u2714 Fixed user: ".concat(user.email));
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log("\n\uD83C\uDF89 Migration completed! Total fixed: ".concat(updated));
                    return [3 /*break*/, 10];
                case 7:
                    err_1 = _a.sent();
                    console.error("❌ Migration failed:", err_1);
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 9:
                    _a.sent();
                    console.log("🔌 Disconnected from MongoDB");
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
migrateUserPlans();
