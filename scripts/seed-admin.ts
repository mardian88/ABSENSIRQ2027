import { auth } from "../src/lib/auth";

async function main() {
    try {
        console.log("Creating admin user...");
        const res = await auth.api.signUpEmail({
            body: {
                email: "admin",
                password: "mardian28",
                name: "Admin Pusat"
            }
        });
        console.log("Admin user created successfully:", res);
    } catch (e) {
        console.error("Failed:", e);
    }
}

main();
