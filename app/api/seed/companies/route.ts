import { NextResponse } from "next/server";
import { query } from "@/lib/neon";

const NOIDA_COMPANIES = [
  {
    name: "Adobe Systems India Pvt Ltd",
    address: "Adobe Towers I-1A, City Centre, Sector 25A, NOIDA-201301",
    phone: "+91.120.2444711",
    website: "www.adobeindia.com",
    domain: "adobeindia.com",
    industry: "Technology",
  },
  {
    name: "AgreeYa Solutions (India) Pvt Ltd",
    address: "B-38 C/2, Sector 57, NOIDA 201301",
    phone: "+91 (120) 439-4400",
    website: "www.agreeya.com",
    domain: "agreeya.com",
    industry: "Technology",
  },
  {
    name: "All e Technologies (P) Ltd",
    address: "A-67, Sector 57, Noida-201301",
    phone: "91 120 25886-56/57/58/59",
    website: "www.alletec.com",
    domain: "alletec.com",
    industry: "Technology",
  },
  {
    name: "Appel Services (Essel Shyam Communication Ltd)",
    address: "C-34, Sector 62, Electronic City, Noida-201307",
    phone: "91-120-2400780 / 2402315",
    website: "www.esselshyam.net/appel/",
    domain: "esselshyam.net",
    industry: "Technology",
  },
  {
    name: "Artech Infosystems Pvt Ltd",
    address: "A-4 & 5, II Floor, Logix Park, Sector 16, Noida-201301",
    phone: "+91 120 4033333",
    website: "www.artechinfo.in",
    domain: "artechinfo.in",
    industry: "Technology",
  },
  {
    name: "Axes Technologies (I) Pvt Ltd",
    address: "B-26, Sector 57, Noida 201301",
    phone: "+91 120 4032700",
    website: "www.axestech.com",
    domain: "axestech.com",
    industry: "Technology",
  },
  {
    name: "Axis IT&T Limited",
    address: "D-30, Sector 3, Noida-201301",
    phone: "+91-120-2442920",
    website: "www.axisitt.com",
    domain: "axisitt.com",
    industry: "Technology",
  },
  {
    name: "Baypackets Technologies Pvt Ltd",
    address: "C-42 Sector 58, Noida-201303",
    phone: "+91-120-2588272",
    website: "www.baypackets.com",
    domain: "baypackets.com",
    industry: "Technology",
  },
  {
    name: "Birlasoft Limited",
    address:
      "Software Technology Park, Ganga Shopping Complex Sector 29, Noida-201303",
    phone: "540408/540395/540590",
    website: "www.birlasoft.net",
    domain: "birlasoft.net",
    industry: "Technology",
  },
  {
    name: "BrickRed Technologies Pvt Ltd",
    address: "B-2, Sector 59, Noida-201301",
    phone: "+91.120.4324555",
    website: "www.brickred.com",
    domain: "brickred.com",
    industry: "Technology",
  },
  {
    name: "Cadence Design Systems India Pvt Ltd",
    address: "Plot 57A,B & C, NSEZ, Noida-201305",
    phone: "+91.120.3984000",
    website: "www.cadence.com",
    domain: "cadence.com",
    industry: "Technology",
  },
  {
    name: "ClearTrail Technologies Pvt Ltd",
    address: "D-27, Sector 59, Noida-201307",
    phone: "91-120-4363300",
    website: "www.clear-trail.com",
    domain: "clear-trail.com",
    industry: "Technology",
  },
  {
    name: "Cleave Global e-Services Pvt Ltd",
    address: "D-180, Sector 63, Noida-201301",
    phone: "+91-120-2404258",
    website: "www.cleaveglobal.com",
    domain: "cleaveglobal.com",
    industry: "Technology",
  },
  {
    name: "Colwell & Salmon Communications (India) Ltd",
    address: "C-39, Sector 58, Noida-201301",
    phone: "+91-120-2589901",
    website: "www.b2b-bridge.com",
    domain: "b2b-bridge.com",
    industry: "Technology",
  },
  {
    name: "Corbus (India) Pvt Ltd",
    address: "SDF C-5/B-9/C-7, Software Technology Park, NEPZ Noida-201305",
    phone: "91 120 2567030",
    website: "www.corbus.com",
    domain: "corbus.com",
    industry: "Technology",
  },
  {
    name: "CoreObjects India Pvt Ltd",
    address: "Logix Techno Park Tower D GF, Plot 5 Sector 127, Noida-201301",
    phone: "+91 120 4019000",
    website: "www.coreobjects.com",
    domain: "coreobjects.com",
    industry: "Technology",
  },
  {
    name: "Eclipse Systems Pvt Ltd",
    address: "207/IV STPI, Sector 29 Noida-201303",
    phone: "+91-120-2452815/36",
    website: "www.eclsys.com",
    domain: "eclsys.com",
    industry: "Technology",
  },
  {
    name: "EXL Service India Pvt Ltd",
    address: "A-48 Sector 58 Noida / A-98 Sector 58 Noida",
    phone: "+91 120 2445900 / 2444822",
    website: "www.exlservice.com",
    domain: "exlservice.com",
    industry: "Technology",
  },
  {
    name: "Granada Services Ltd (iEnergizer)",
    address: "A-37 Sector 60, Noida-201301",
    phone: "+91 120 2580110/2580287",
    website: "www.ienergizer.com",
    domain: "ienergizer.com",
    industry: "Technology",
  },
  {
    name: "GrapeCity India Pvt Ltd",
    address: "A-15 Sector 62 Noida-201307",
    phone: "+91 (120) 2470123",
    website: "www.grapecity.com/india",
    domain: "grapecity.com",
    industry: "Technology",
  },
  {
    name: "HCL Corporation Ltd",
    address: "E-4/5/6 Sector 11 Noida-201301",
    phone: "+91-120-2526518/19",
    website: null,
    domain: "hcl.in",
    industry: "Technology",
  },
  {
    name: "HCL Technologies BPO Services Ltd",
    address: "A-104 Sector 58 Noida-201307",
    phone: "0120-2589690",
    website: "www.hclbpo.com",
    domain: "hclbpo.com",
    industry: "Technology",
  },
  {
    name: "HCL Technologies Ltd",
    address: "A-1/CD Sector 16 Noida-201301",
    phone: "+91-120-2516321",
    website: "www.hcl.in",
    domain: "hcltech.com",
    industry: "Technology",
  },
  {
    name: "Hurix Systems Pvt Ltd",
    address: "C-56/10 2nd Floor Sector 62 Noida-201301",
    phone: "+91-120-4262688",
    website: "www.hurix.com",
    domain: "hurix.com",
    industry: "Technology",
  },
  {
    name: "Impetus Infotech Pvt Ltd",
    address: "D-27 Sector 59 Noida-201307",
    phone: "+91.120.4363300",
    website: "www.impetus.com",
    domain: "impetus.com",
    industry: "Technology",
  },
  {
    name: "India Insure Risk Management Services",
    address: "A-70 Sector 2 Noida-201301",
    phone: "0120-4320666/8/9",
    website: "www.indiainsure.com",
    domain: "indiainsure.com",
    industry: "Insurance",
  },
  {
    name: "Induslogic India Pvt Ltd",
    address: "B-34/1 Sector 59 Noida-201301",
    phone: "(+91) (120) 4342000",
    website: "www.induslogic.com",
    domain: "induslogic.com",
    industry: "Technology",
  },
  {
    name: "Info Edge India Ltd",
    address: "B-77/B-56 Sector 5 Noida-201301",
    phone: "4303300/4303400",
    website: "www.naukri.com",
    domain: "naukri.com",
    industry: "Technology",
  },
  {
    name: "Infogain India Pvt Ltd",
    address: "A-16 Sector 60 Noida-201301",
    phone: "91 120 2445144",
    website: "www.infogain.com",
    domain: "infogain.com",
    industry: "Technology",
  },
  {
    name: "Infopro India Pvt Ltd",
    address: "C-4 Sector 58 Noida-201307",
    phone: "+91-120-2586524",
    website: "www.infoprocorp.com",
    domain: "infoprocorp.com",
    industry: "Technology",
  },
  {
    name: "Interra Information Technologies",
    address: "E-14 NSEZ Noida-201305",
    phone: "+91 120 2568037",
    website: "www.interrait.com",
    domain: "interrait.com",
    industry: "Technology",
  },
  {
    name: "Interra Software India Pvt Ltd",
    address: "E-14 NEPZ Noida-201305",
    phone: "568037",
    website: null,
    domain: "interrasoftware.com",
    industry: "Technology",
  },
  {
    name: "JK Technosoft Ltd",
    address: "F-3 Sector 3 Noida-201301",
    phone: "+91 120 2539133-37",
    website: "www.jktech.com",
    domain: "jktech.com",
    industry: "Technology",
  },
  {
    name: "JV Info Solutions",
    address: "A-28 3rd Floor Sector 16 Noida-201301",
    phone: null,
    website: "www.jvinfosol.com",
    domain: "jvinfosol.com",
    industry: "Technology",
  },
  {
    name: "Liqvid eLearning Services Pvt Ltd",
    address: "F3 Sector 8 Noida-201301",
    phone: "+91 (120) 4039000/2424240",
    website: "www.liqvid.com",
    domain: "liqvid.com",
    industry: "EdTech",
  },
  {
    name: "Logix Techno Park",
    address: "Plot 5 Sector 127 Noida",
    phone: "+91-1204393000",
    website: "www.logixtechnopark.com",
    domain: "logixtechnopark.com",
    industry: "Real Estate",
  },
  {
    name: "netCustomer India Pvt Ltd",
    address: "B-34/2 Sector 59 Noida-201301",
    phone: "+91.120.4358686",
    website: "www.netcustomer.com",
    domain: "netcustomer.com",
    industry: "Technology",
  },
  {
    name: "NetEdge Computing Global Services",
    address: "A-14 Sector 7 Noida-201301",
    phone: "+91-120-2423809",
    website: "www.netedgecomputing.com",
    domain: "netedgecomputing.com",
    industry: "Technology",
  },
  {
    name: "Network Programs India Ltd",
    address: "B-1-C Sector 10 Noida-201301",
    phone: "+91-120-2536622",
    website: "www.networkprograms.com",
    domain: "networkprograms.com",
    industry: "Technology",
  },
  {
    name: "NextBrick Solutions Ltd",
    address: "G-11 Sector 11 Noida-201301",
    phone: "+91-120-4043000",
    website: "www.nextbrick.com",
    domain: "nextbrick.com",
    industry: "Technology",
  },
  {
    name: "Nucleus Software Exports Ltd",
    address: "A-39 Sector 62 Noida-201307",
    phone: "+91-120-2404050",
    website: "www.nucleussoftware.com",
    domain: "nucleussoftware.com",
    industry: "Technology",
  },
  {
    name: "Pan Business Lists Pvt Ltd",
    address: "E-31 Sector 8 Noida-201301",
    phone: "+91-120-4263134",
    website: "www.panbusiness.de",
    domain: "panbusiness.de",
    industry: "Technology",
  },
  {
    name: "Perot Systems TSI India Ltd",
    address: "Plot 3 Sector 125 Noida-201301",
    phone: "+91 120 2432750-79",
    website: "www.perotsystems.com",
    domain: "perotsystems.com",
    industry: "Technology",
  },
  {
    name: "Pixtel Media Technology Pvt Ltd",
    address: "A-4 & 5 Logix Park Sector 16 Noida-201301",
    phone: "+91 120 4343900",
    website: "www.pixtelmtk.com",
    domain: "pixtelmtk.com",
    industry: "Technology",
  },
  {
    name: "Polyplex Infotech Pvt Ltd",
    address: "Floor 1A B-37 Sector 1 Noida-201301",
    phone: "+91 (120) 2531811/12",
    website: "www.polyinfotech.com",
    domain: "polyinfotech.com",
    industry: "Technology",
  },
  {
    name: "Progressive Infotech Pvt Ltd",
    address: "C-161 Phase II Ext Noida-201305",
    phone: "+91-120-4393939",
    website: "www.progressive.in",
    domain: "progressive.in",
    industry: "Technology",
  },
  {
    name: "Pyramid IT Consulting Pvt Ltd",
    address: "D-26 Sector 63 Noida-201301",
    phone: "+91-120-4343500",
    website: "www.pyramidci.com",
    domain: "pyramidci.com",
    industry: "Technology",
  },
  {
    name: "QA InfoTech Pvt Ltd",
    address: "B-8 1st/2nd Floor Sector 59 Noida-201301",
    phone: "+91-120-2581691/53244534",
    website: "www.qainfotech.com",
    domain: "qainfotech.com",
    industry: "Technology",
  },
  {
    name: "R Systems International Ltd",
    address: "C-40 Sector 59 Noida-201307",
    phone: "(91)120-4303500",
    website: "www.rsystems.com",
    domain: "rsystems.com",
    industry: "Technology",
  },
  {
    name: "Rapidigm India Ltd",
    address: "B-118/119 Sector 2 Noida-201301",
    phone: "866-573-4401",
    website: "www.rapidigm.com",
    domain: "rapidigm.com",
    industry: "Technology",
  },
  {
    name: "Relsys India Pvt Ltd",
    address: "Logix Park A-4 & 5 Sector 16 Noida-201301",
    phone: "+91 120 2445567",
    website: "www.relsys.net",
    domain: "relsys.net",
    industry: "Technology",
  },
  {
    name: "RMSI Pvt Ltd",
    address: "A-7 Sector 16 Noida-201301",
    phone: "+91 120 2511102/2512101",
    website: "www.rmsi.com",
    domain: "rmsi.com",
    industry: "Technology",
  },
  {
    name: "RocSearch India Pvt Ltd",
    address: "A-16 Sector 16 Noida-201301",
    phone: "+91-120-4017100",
    website: "www.rocsearch.com",
    domain: "rocsearch.com",
    industry: "Technology",
  },
  {
    name: "Safenet Infotech Pvt Ltd",
    address: "Tower C 6th Floor Plot 5 Sector 127 Noida",
    phone: "+91 120 4020555",
    website: "www.safenet-inc.com",
    domain: "safenet-inc.com",
    industry: "Technology",
  },
  {
    name: "Saigun Technologies Pvt Ltd",
    address: "A-27/E Sector 16 Noida-201301",
    phone: "+91 120 4315560/1/2",
    website: "www.saigun.com",
    domain: "saigun.com",
    industry: "Technology",
  },
  {
    name: "Saksoft Ltd",
    address: "B 35-36 Sector 80 Noida-201305",
    phone: "+91-120-2462175",
    website: "www.saksoft.com",
    domain: "saksoft.com",
    industry: "Technology",
  },
  {
    name: "Scicom Technologies Pvt Ltd",
    address: "A-67 Sector 57 Noida-201301",
    phone: "+91.120.4343700",
    website: "www.scicmp.com",
    domain: "scicmp.com",
    industry: "Technology",
  },
  {
    name: "SDG Software India Pvt Ltd",
    address: "B-3 SDF NSEZ Noida-201305",
    phone: "+91.120.2568791-5",
    website: "www.sdgc.com",
    domain: "sdgc.com",
    industry: "Technology",
  },
  {
    name: "Shreema Software Solutions Pvt Ltd",
    address: "314 Vishal Chambers Sector 18 Noida-201301",
    phone: "91-120-2514831/32",
    website: "www.shreemasoft.com",
    domain: "shreemasoft.com",
    industry: "Technology",
  },
  {
    name: "Srishti Software Pvt Ltd",
    address: "A-135 Ground Floor Sector 15 Noida-201301",
    phone: "+91-9945239358",
    website: "www.srishtisoft.com",
    domain: "srishtisoft.com",
    industry: "Technology",
  },
  {
    name: "ST Microelectronics Ltd",
    address: "Plot 2 & 3 Sector 16A Noida-201301",
    phone: null,
    website: "www.st.com/stonline",
    domain: "st.com",
    industry: "Technology",
  },
  {
    name: "Syncata India Pvt Ltd",
    address: "Tower C 1st Floor Logix Technopark Sector 127 Noida-201301",
    phone: "+91-120-4268509-12",
    website: null,
    domain: "syncata.com",
    industry: "Technology",
  },
  {
    name: "Synopsys India Pvt Ltd",
    address: "A-4 & 5 Logix Park Sector 16 Noida-201301",
    phone: "91-120-2476500",
    website: "www.synopsys.com",
    domain: "synopsys.com",
    industry: "Technology",
  },
  {
    name: "Tata Consultancy Services Ltd",
    address: "D4 Sector 3 Noida-201301",
    phone: "91-120-2531622-25",
    website: "www.tcs.com",
    domain: "tcs.com",
    industry: "Technology",
  },
  {
    name: "Tech Mahindra Ltd",
    address: "B-26 Sector 57 Noida-201301",
    phone: "+91 120 4032700",
    website: "www.mahindrabt.com",
    domain: "techmahindra.com",
    industry: "Technology",
  },
  {
    name: "TechSpan India Ltd",
    address: "D-4 Sector 59 Noida-201307",
    phone: "+91-120-4074000",
    website: "www.headstrong.com",
    domain: "headstrong.com",
    industry: "Technology",
  },
  {
    name: "Thomson Digital (ITES) NSEZ",
    address: "B/10-12 NSEZ Noida-201305",
    phone: "+91-120-2562499/2563407",
    website: "www.thomsondigital.com",
    domain: "thomsondigital.com",
    industry: "Technology",
  },
  {
    name: "UPTEC Computer Consultancy Ltd",
    address: "C-10 Sector 10 Noida-201301",
    phone: "0120-2544414/2544200/2532529",
    website: "www.uptecnet.com",
    domain: "uptecnet.com",
    industry: "Technology",
  },
  {
    name: "Virage Logic International",
    address: "A-75 Sector 57 Noida-201307",
    phone: "+91-120-2588881-4",
    website: "www.viragelogic.com",
    domain: "viragelogic.com",
    industry: "Technology",
  },
  {
    name: "Xansa India Ltd",
    address: "C-2 Sector 1 Noida-201301",
    phone: null,
    website: "www.xansa.com",
    domain: "xansa.com",
    industry: "Technology",
  },
  {
    name: "Xcelore Private Limited",
    address:
      "Office Number 15, 6th Floor, Tower-A, STELLAR IT PARK, C-25, C Block, Phase 2, Industrial Area, Sector 62, Noida, Uttar Pradesh 201309",
    phone: "+91 81784 97981",
    website: "https://xcelore.com/",
    domain: "xcelore.com",
    industry: "Technology",
  },
];

export async function POST() {
  try {
    // First, add new columns if they don't exist
    await query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT`);
    await query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT`);
    await query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT`);
    await query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT`);
    await query(
      `ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT`
    );
    await query(
      `ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_count TEXT`
    );
    await query(
      `ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'Technology'`
    );

    // Delete existing channels for companies first (due to foreign key constraints)
    await query(`DELETE FROM channels WHERE type = 'company'`);

    // Delete existing companies
    await query(`DELETE FROM companies`);

    // Insert all companies and create channels for them
    let insertedCount = 0;
    let channelsCreated = 0;

    for (const company of NOIDA_COMPANIES) {
      try {
        // Insert company and get its ID
        const companyResult = await query(
          `INSERT INTO companies (name, address, phone, website, domain, verified, industry) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            company.name,
            company.address,
            company.phone,
            company.website,
            company.domain,
            true,
            company.industry,
          ]
        );
        insertedCount++;

        // Create a channel for this company
        if (companyResult.length > 0) {
          const companyId = companyResult[0].id;
          await query(
            `INSERT INTO channels (id, name, type, company_id, description, is_private)
             VALUES ($1, $2, 'company', $3, $4, false)`,
            [
              companyId, // Use same ID as company for channel
              company.name,
              companyId,
              `Official channel for ${company.name} employees and discussions`,
            ]
          );
          channelsCreated++;
        }
      } catch (err) {
        console.error(`Failed to insert company ${company.name}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully inserted ${insertedCount} companies and created ${channelsCreated} channels`,
      total: NOIDA_COMPANIES.length,
    });
  } catch (error) {
    console.error("Seed companies error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed companies",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to this endpoint to seed companies data",
    total_companies: NOIDA_COMPANIES.length,
  });
}
