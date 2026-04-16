import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedUnit = { unitName: string; tenantName: string; monthlyRent: number };
type SeedProperty = { address: string; units: SeedUnit[] };

const portfolio: SeedProperty[] = [
  {
    address: "111 A Dupont",
    units: [{ unitName: "1", tenantName: "Tomasz Rapacz", monthlyRent: 2500.0 }],
  },
  {
    address: "141 Richardson",
    units: [
      { unitName: "Duplex", tenantName: "Peter, Rob, Riley", monthlyRent: 3600.0 },
      { unitName: "3rd Floor", tenantName: "Megan Dolan", monthlyRent: 2200.0 },
    ],
  },
  {
    address: "254 Franklin",
    units: [
      { unitName: "Basement", tenantName: "Roberto Flores", monthlyRent: 1550.0 },
      { unitName: "1st Floor", tenantName: "Javier Molina", monthlyRent: 1850.0 },
      { unitName: "2nd Floor", tenantName: "Kylie Fife", monthlyRent: 987.5 },
      { unitName: "2nd Floor", tenantName: "Christy Pitre", monthlyRent: 1287.5 },
    ],
  },
  {
    address: "1281 Jefferson",
    units: [
      { unitName: "1st Floor", tenantName: "Gloria (Angel)", monthlyRent: 2000.0 },
      { unitName: "2nd Floor", tenantName: "Maria", monthlyRent: 2000.0 },
      { unitName: "3rd Floor", tenantName: "Timothy Race", monthlyRent: 2000.0 },
    ],
  },
  {
    address: "1035 Manhattan",
    units: [
      { unitName: "Cafe", tenantName: "Cafe Armenia", monthlyRent: 7500.0 },
      { unitName: "Rear House", tenantName: "Unknown", monthlyRent: 2300.0 },
      { unitName: "2 Front", tenantName: "Vacant", monthlyRent: 0.0 },
      { unitName: "2 Rear", tenantName: "Unknown", monthlyRent: 1500.0 },
      { unitName: "3 Front", tenantName: "Vacant", monthlyRent: 0.0 },
      { unitName: "3 Rear", tenantName: "Vacant", monthlyRent: 0.0 },
      { unitName: "4 Front", tenantName: "Unknown", monthlyRent: 600.0 },
      { unitName: "4 Rear", tenantName: "Vacant", monthlyRent: 0.0 },
    ],
  },
  {
    address: "233 Suydam",
    units: [
      { unitName: "1 Front", tenantName: "Cortes Silvetior", monthlyRent: 2400.0 },
      { unitName: "2 Rear", tenantName: "Nelly Iniguez", monthlyRent: 1625.0 },
      { unitName: "2 Left", tenantName: "Francesca Conde", monthlyRent: 2000.0 },
      { unitName: "3 Rear", tenantName: "Meridelvis Jimenez", monthlyRent: 1725.0 },
      { unitName: "3 Left", tenantName: "Jaqueline Cantwell", monthlyRent: 2200.0 },
    ],
  },
  {
    address: "114 Cooper",
    units: [
      { unitName: "Apartment 1", tenantName: "Maria Salazar", monthlyRent: 1850.0 },
      { unitName: "Apartment 2", tenantName: "Unknown", monthlyRent: 1950.0 },
      { unitName: "Apartment 3", tenantName: "Juan Tlatelpa", monthlyRent: 2100.0 },
    ],
  },
];

async function main() {
  console.log("Seeding Speranza Properties portfolio...");

  for (const p of portfolio) {
    const property = await prisma.property.upsert({
      where: { address: p.address },
      update: {},
      create: { address: p.address },
    });

    for (const u of p.units) {
      const existing = await prisma.unit.findFirst({
        where: {
          propertyId: property.id,
          unitName: u.unitName,
          tenantName: u.tenantName,
        },
      });
      if (existing) {
        await prisma.unit.update({
          where: { id: existing.id },
          data: { monthlyRent: u.monthlyRent },
        });
      } else {
        await prisma.unit.create({
          data: {
            propertyId: property.id,
            unitName: u.unitName,
            tenantName: u.tenantName,
            monthlyRent: u.monthlyRent,
          },
        });
      }
    }

    console.log(`  ✓ ${p.address} (${p.units.length} units)`);
  }

  const propertyCount = await prisma.property.count();
  const unitCount = await prisma.unit.count();
  console.log(`\nDone. ${propertyCount} properties, ${unitCount} units.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
