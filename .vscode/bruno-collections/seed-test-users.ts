#!/usr/bin/env bun

/**
 * Seed script for creating test users required by Bruno integration tests.
 *
 * This script creates the following test users if they don't already exist:
 * - test-user@example.com: Used for successful login tests
 * - duplicate-test@example.com: Used for duplicate registration tests
 *
 * Usage:
 *   bun run tests/bruno/seed-test-users.ts
 *   or
 *   bun run seed:test
 */

import { createUser, getUserByEmail } from "../../webapi/src/modules/auth/service.ts";
import { createService, getServiceByName } from "../../webapi/src/modules/service/service.ts";
import { UserRole } from "../../webapi/src/constants/userRole.ts";
import { closeDb } from "../../webapi/src/database/connection.ts";
import { getLogger } from "@logtape/logtape";

const logger = await getLogger("seed-test-users");

// Test user configurations
const TEST_USERS = [
  {
    email: "test-user@example.com",
    password: "TestPassword123!",
    description: "Used for successful login tests",
  },
  {
    email: "duplicate-test@example.com",
    password: "TestPassword123!",
    description: "Used for duplicate registration error tests",
  },
  {
    email: "admin-test@example.com",
    password: "TestPassword123!",
    role: UserRole.ADMIN,
    description: "Used for admin API tests",
  },
];

async function seedTestUsers() {
  logger.info("Starting test user seeding process");

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const testUser of TEST_USERS) {
    try {
      // Check if user already exists
      const existing = getUserByEmail(testUser.email);

      if (existing) {
        logger.info(`Skipping ${testUser.email} - already exists`);
        skipped++;
        continue;
      }

      // Create the user
      await createUser({
        email: testUser.email,
        password: testUser.password,
        ...(testUser.role && { role: testUser.role }),
      });

      logger.info(`Created ${testUser.email} - ${testUser.description}`);
      created++;
    } catch (error) {
      logger.error(`Failed to create ${testUser.email}:`, error);
      errors++;
    }
  }

  logger.info("Test user seeding complete", {
    created,
    skipped,
    errors,
    total: TEST_USERS.length,
  });

  // Print summary to console
  console.log("\n=== Test User Seeding Summary ===");
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total: ${TEST_USERS.length}`);

  if (created > 0) {
    console.log("\n✓ Test users ready for Bruno tests");
  }

  if (errors > 0) {
    console.error("\n✗ Some users failed to seed. Check logs for details.");
    process.exit(1);
  }
}

// Default services to seed
const DEFAULT_SERVICES = [
  { name: "Evening", description: "Evening service shift" },
  { name: "Breakfast", description: "Breakfast service shift" },
  { name: "Cooks", description: "Cooking service shift" },
  { name: "Logistics", description: "Logistics service shift" },
];

function seedServices() {
  logger.info("Starting service seeding process");

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const service of DEFAULT_SERVICES) {
    try {
      const existing = getServiceByName(service.name);

      if (existing) {
        logger.info(`Skipping service ${service.name} - already exists`);
        skipped++;
        continue;
      }

      createService(service);
      logger.info(`Created service: ${service.name}`);
      created++;
    } catch (error) {
      logger.error(`Failed to create service ${service.name}:`, error);
      errors++;
    }
  }

  console.log("\n=== Service Seeding Summary ===");
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total: ${DEFAULT_SERVICES.length}`);

  if (created > 0) {
    console.log("\n✓ Services ready for Bruno tests");
  }

  return errors;
}

// Run the seeding process
try {
  await seedTestUsers();
  const serviceErrors = seedServices();
  closeDb();

  if (serviceErrors > 0) {
    console.error("\n✗ Some services failed to seed. Check logs for details.");
    process.exit(1);
  }
} catch (error) {
  logger.error("Fatal error during seeding:", error);
  console.error("\n✗ Fatal error during seeding:", error);
  closeDb();
  process.exit(1);
}
