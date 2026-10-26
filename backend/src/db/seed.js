const bcrypt = require("bcryptjs");
const pool = require("./pool");

const PATHWAYS = [
  {
    code: "manufacturing",
    name: "Manufacturing Licence",
    description: "For businesses manufacturing AYUSH drugs/formulations under their own facility.",
  },
  {
    code: "loan_licence",
    name: "Loan Licence",
    description: "For businesses manufacturing AYUSH products using another licensed manufacturer's facility.",
  },
  {
    code: "gmp",
    name: "GMP Certification",
    description: "Good Manufacturing Practices certification required for quality compliance and exports.",
  },
  {
    code: "export",
    name: "Export / Certificate of Pharmaceutical Product",
    description: "For businesses exporting AYUSH products and needing a Certificate of Pharmaceutical Product.",
  },
  {
    code: "clinic",
    name: "Clinic / Service Registration",
    description: "For AYUSH clinics, wellness centres, and practitioners offering services directly to patients.",
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const p of PATHWAYS) {
      await client.query(
        `INSERT INTO pathways (name, code, description) VALUES ($1,$2,$3)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
        [p.name, p.code, p.description]
      );
    }

    const adminHash = await bcrypt.hash("Admin@123", 10);
    const officerHash = await bcrypt.hash("Officer@123", 10);
    const applicantHash = await bcrypt.hash("Applicant@123", 10);

    const adminRes = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ('Platform Admin','admin@ayureg.gov.in','9999900000',$1,'admin')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [adminHash]
    );

    const officerRes = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ('Reviewing Officer','officer@ayureg.gov.in','9999900001',$1,'officer')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [officerHash]
    );

    const applicantRes = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ('Demo Founder','founder@example.com','9999900002',$1,'applicant')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [applicantHash]
    );

    const applicantId = applicantRes.rows[0].id;

    const bizRes = await client.query(
      `INSERT INTO businesses (user_id, business_name, description, category)
       VALUES ($1, 'Herbal Wellness Co.', 'We manufacture classical Ayurvedic churnas and tablets for retail sale.', 'Ayurveda')
       RETURNING id`,
      [applicantId]
    );
    const bizId = bizRes.rows[0].id;

    const pathwayRes = await client.query(`SELECT id FROM pathways WHERE code = 'manufacturing'`);
    const pathwayId = pathwayRes.rows[0].id;

    const appRes = await client.query(
      `INSERT INTO applications (business_id, pathway_id, status)
       VALUES ($1, $2, 'draft') RETURNING id`,
      [bizId, pathwayId]
    );
    const appId = appRes.rows[0].id;

    const checklist = [
      "Business registration certificate (GST/Udyam)",
      "Site plan and layout of manufacturing unit",
      "List of machinery and equipment",
      "Details of qualified technical staff",
      "Product formulation / master formula records",
    ];
    for (const label of checklist) {
      await client.query(
        `INSERT INTO checklist_items (application_id, label, required, status)
         VALUES ($1, $2, true, 'pending')`,
        [appId, label]
      );
    }

    await client.query("COMMIT");
    console.log("Seed complete.");
    console.log("Admin login: admin@ayureg.gov.in / Admin@123");
    console.log("Officer login: officer@ayureg.gov.in / Officer@123");
    console.log("Applicant login: founder@example.com / Applicant@123");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
