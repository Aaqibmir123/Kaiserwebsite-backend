"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return Promise.resolve()
        .then(function () { return prisma.orderItem.deleteMany(); })
        .then(function () { return prisma.order.deleteMany(); })
        .then(function () { return prisma.cartItem.deleteMany(); })
        .then(function () { return prisma.favorite.deleteMany(); })
        .then(function () { return prisma.address.deleteMany(); })
        .then(function () { return prisma.otpCode.deleteMany(); })
        .then(function () { return prisma.sellerApplication.deleteMany(); })
        .then(function () { return prisma.product.deleteMany(); })
        .then(function () { return prisma.sellerStore.deleteMany(); })
        .then(function () { return prisma.category.deleteMany(); })
        .then(function () { return prisma.user.deleteMany(); })
        .then(function () {
        console.log('Seed complete. Demo records cleared. Add real data through the admin panel.');
    });
}
main().finally(function () { return prisma.$disconnect(); });
