import bcrypt from "bcrypt";

const passwords = [
    "admin123",
    "editor123",
    "viewer123",
    "editor456",
    "viewer456",
    "admin456",
    "viewer789",
    "editor789",
    "viewer101112",
    "viewer131415"
];

const run = async () => {
    for (let i = 0; i < passwords.length; i++) {
        const hashed = await bcrypt.hash(passwords[i], 10);
        console.log(`User ${i + 1}: ${passwords[i]} → ${hashed}`);
    }
};

run();
