-- AnonWork Platform - Noida IT Companies Data
-- Run this in Neon SQL Editor

-- First, add new columns to companies table if they don't exist
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_count TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'Technology';

-- Delete existing companies (optional - remove this line if you want to keep old data)
DELETE FROM companies;

-- Insert all 71 Noida IT Companies
INSERT INTO companies (name, address, phone, website, domain, verified, industry) VALUES
('Adobe Systems India Pvt Ltd', 'Adobe Towers I-1A, City Centre, Sector 25A, NOIDA-201301', '+91.120.2444711', 'www.adobeindia.com', 'adobeindia.com', true, 'Technology'),
('AgreeYa Solutions (India) Pvt Ltd', 'B-38 C/2, Sector 57, NOIDA 201301', '+91 (120) 439-4400', 'www.agreeya.com', 'agreeya.com', true, 'Technology'),
('All e Technologies (P) Ltd', 'A-67, Sector 57, Noida-201301', '91 120 25886-56/57/58/59', 'www.alletec.com', 'alletec.com', true, 'Technology'),
('Appel Services (Essel Shyam Communication Ltd)', 'C-34, Sector 62, Electronic City, Noida-201307', '91-120-2400780 / 2402315', 'www.esselshyam.net/appel/', 'esselshyam.net', true, 'Technology'),
('Artech Infosystems Pvt Ltd', 'A-4 & 5, II Floor, Logix Park, Sector 16, Noida-201301', '+91 120 4033333', 'www.artechinfo.in', 'artechinfo.in', true, 'Technology'),
('Axes Technologies (I) Pvt Ltd', 'B-26, Sector 57, Noida 201301', '+91 120 4032700', 'www.axestech.com', 'axestech.com', true, 'Technology'),
('Axis IT&T Limited', 'D-30, Sector 3, Noida-201301', '+91-120-2442920', 'www.axisitt.com', 'axisitt.com', true, 'Technology'),
('Baypackets Technologies Pvt Ltd', 'C-42 Sector 58, Noida-201303', '+91-120-2588272', 'www.baypackets.com', 'baypackets.com', true, 'Technology'),
('Birlasoft Limited', 'Software Technology Park, Ganga Shopping Complex Sector 29, Noida-201303', '540408/540395/540590', 'www.birlasoft.net', 'birlasoft.net', true, 'Technology'),
('BrickRed Technologies Pvt Ltd', 'B-2, Sector 59, Noida-201301', '+91.120.4324555', 'www.brickred.com', 'brickred.com', true, 'Technology'),
('Cadence Design Systems India Pvt Ltd', 'Plot 57A,B & C, NSEZ, Noida-201305', '+91.120.3984000', 'www.cadence.com', 'cadence.com', true, 'Technology'),
('ClearTrail Technologies Pvt Ltd', 'D-27, Sector 59, Noida-201307', '91-120-4363300', 'www.clear-trail.com', 'clear-trail.com', true, 'Technology'),
('Cleave Global e-Services Pvt Ltd', 'D-180, Sector 63, Noida-201301', '+91-120-2404258', 'www.cleaveglobal.com', 'cleaveglobal.com', true, 'Technology'),
('Colwell & Salmon Communications (India) Ltd', 'C-39, Sector 58, Noida-201301', '+91-120-2589901', 'www.b2b-bridge.com', 'b2b-bridge.com', true, 'Technology'),
('Corbus (India) Pvt Ltd', 'SDF C-5/B-9/C-7, Software Technology Park, NEPZ Noida-201305', '91 120 2567030', 'www.corbus.com', 'corbus.com', true, 'Technology'),
('CoreObjects India Pvt Ltd', 'Logix Techno Park Tower D GF, Plot 5 Sector 127, Noida-201301', '+91 120 4019000', 'www.coreobjects.com', 'coreobjects.com', true, 'Technology'),
('Eclipse Systems Pvt Ltd', '207/IV STPI, Sector 29 Noida-201303', '+91-120-2452815/36', 'www.eclsys.com', 'eclsys.com', true, 'Technology'),
('EXL Service India Pvt Ltd', 'A-48 Sector 58 Noida / A-98 Sector 58 Noida', '+91 120 2445900 / 2444822', 'www.exlservice.com', 'exlservice.com', true, 'Technology'),
('Granada Services Ltd (iEnergizer)', 'A-37 Sector 60, Noida-201301', '+91 120 2580110/2580287', 'www.ienergizer.com', 'ienergizer.com', true, 'Technology'),
('GrapeCity India Pvt Ltd', 'A-15 Sector 62 Noida-201307', '+91 (120) 2470123', 'www.grapecity.com/india', 'grapecity.com', true, 'Technology'),
('HCL Corporation Ltd', 'E-4/5/6 Sector 11 Noida-201301', '+91-120-2526518/19', NULL, 'hcl.in', true, 'Technology'),
('HCL Technologies BPO Services Ltd', 'A-104 Sector 58 Noida-201307', '0120-2589690', 'www.hclbpo.com', 'hclbpo.com', true, 'Technology'),
('HCL Technologies Ltd', 'A-1/CD Sector 16 Noida-201301', '+91-120-2516321', 'www.hcl.in', 'hcltech.com', true, 'Technology'),
('Hurix Systems Pvt Ltd', 'C-56/10 2nd Floor Sector 62 Noida-201301', '+91-120-4262688', 'www.hurix.com', 'hurix.com', true, 'Technology'),
('Impetus Infotech Pvt Ltd', 'D-27 Sector 59 Noida-201307', '+91.120.4363300', 'www.impetus.com', 'impetus.com', true, 'Technology'),
('India Insure Risk Management Services', 'A-70 Sector 2 Noida-201301', '0120-4320666/8/9', 'www.indiainsure.com', 'indiainsure.com', true, 'Insurance'),
('Induslogic India Pvt Ltd', 'B-34/1 Sector 59 Noida-201301', '(+91) (120) 4342000', 'www.induslogic.com', 'induslogic.com', true, 'Technology'),
('Info Edge India Ltd', 'B-77/B-56 Sector 5 Noida-201301', '4303300/4303400', 'www.naukri.com', 'naukri.com', true, 'Technology'),
('Infogain India Pvt Ltd', 'A-16 Sector 60 Noida-201301', '91 120 2445144', 'www.infogain.com', 'infogain.com', true, 'Technology'),
('Infopro India Pvt Ltd', 'C-4 Sector 58 Noida-201307', '+91-120-2586524', 'www.infoprocorp.com', 'infoprocorp.com', true, 'Technology'),
('Interra Information Technologies', 'E-14 NSEZ Noida-201305', '+91 120 2568037', 'www.interrait.com', 'interrait.com', true, 'Technology'),
('Interra Software India Pvt Ltd', 'E-14 NEPZ Noida-201305', '568037', NULL, 'interrasoftware.com', true, 'Technology'),
('JK Technosoft Ltd', 'F-3 Sector 3 Noida-201301', '+91 120 2539133-37', 'www.jktech.com', 'jktech.com', true, 'Technology'),
('JV Info Solutions', 'A-28 3rd Floor Sector 16 Noida-201301', NULL, 'www.jvinfosol.com', 'jvinfosol.com', true, 'Technology'),
('Liqvid eLearning Services Pvt Ltd', 'F3 Sector 8 Noida-201301', '+91 (120) 4039000/2424240', 'www.liqvid.com', 'liqvid.com', true, 'EdTech'),
('Logix Techno Park', 'Plot 5 Sector 127 Noida', '+91-1204393000', 'www.logixtechnopark.com', 'logixtechnopark.com', true, 'Real Estate'),
('netCustomer India Pvt Ltd', 'B-34/2 Sector 59 Noida-201301', '+91.120.4358686', 'www.netcustomer.com', 'netcustomer.com', true, 'Technology'),
('NetEdge Computing Global Services', 'A-14 Sector 7 Noida-201301', '+91-120-2423809', 'www.netedgecomputing.com', 'netedgecomputing.com', true, 'Technology'),
('Network Programs India Ltd', 'B-1-C Sector 10 Noida-201301', '+91-120-2536622', 'www.networkprograms.com', 'networkprograms.com', true, 'Technology'),
('NextBrick Solutions Ltd', 'G-11 Sector 11 Noida-201301', '+91-120-4043000', 'www.nextbrick.com', 'nextbrick.com', true, 'Technology'),
('Nucleus Software Exports Ltd', 'A-39 Sector 62 Noida-201307', '+91-120-2404050', 'www.nucleussoftware.com', 'nucleussoftware.com', true, 'Technology'),
('Pan Business Lists Pvt Ltd', 'E-31 Sector 8 Noida-201301', '+91-120-4263134', 'www.panbusiness.de', 'panbusiness.de', true, 'Technology'),
('Perot Systems TSI India Ltd', 'Plot 3 Sector 125 Noida-201301', '+91 120 2432750-79', 'www.perotsystems.com', 'perotsystems.com', true, 'Technology'),
('Pixtel Media Technology Pvt Ltd', 'A-4 & 5 Logix Park Sector 16 Noida-201301', '+91 120 4343900', 'www.pixtelmtk.com', 'pixtelmtk.com', true, 'Technology'),
('Polyplex Infotech Pvt Ltd', 'Floor 1A B-37 Sector 1 Noida-201301', '+91 (120) 2531811/12', 'www.polyinfotech.com', 'polyinfotech.com', true, 'Technology'),
('Progressive Infotech Pvt Ltd', 'C-161 Phase II Ext Noida-201305', '+91-120-4393939', 'www.progressive.in', 'progressive.in', true, 'Technology'),
('Pyramid IT Consulting Pvt Ltd', 'D-26 Sector 63 Noida-201301', '+91-120-4343500', 'www.pyramidci.com', 'pyramidci.com', true, 'Technology'),
('QA InfoTech Pvt Ltd', 'B-8 1st/2nd Floor Sector 59 Noida-201301', '+91-120-2581691/53244534', 'www.qainfotech.com', 'qainfotech.com', true, 'Technology'),
('R Systems International Ltd', 'C-40 Sector 59 Noida-201307', '(91)120-4303500', 'www.rsystems.com', 'rsystems.com', true, 'Technology'),
('Rapidigm India Ltd', 'B-118/119 Sector 2 Noida-201301', '866-573-4401', 'www.rapidigm.com', 'rapidigm.com', true, 'Technology'),
('Relsys India Pvt Ltd', 'Logix Park A-4 & 5 Sector 16 Noida-201301', '+91 120 2445567', 'www.relsys.net', 'relsys.net', true, 'Technology'),
('RMSI Pvt Ltd', 'A-7 Sector 16 Noida-201301', '+91 120 2511102/2512101', 'www.rmsi.com', 'rmsi.com', true, 'Technology'),
('RocSearch India Pvt Ltd', 'A-16 Sector 16 Noida-201301', '+91-120-4017100', 'www.rocsearch.com', 'rocsearch.com', true, 'Technology'),
('Safenet Infotech Pvt Ltd', 'Tower C 6th Floor Plot 5 Sector 127 Noida', '+91 120 4020555', 'www.safenet-inc.com', 'safenet-inc.com', true, 'Technology'),
('Saigun Technologies Pvt Ltd', 'A-27/E Sector 16 Noida-201301', '+91 120 4315560/1/2', 'www.saigun.com', 'saigun.com', true, 'Technology'),
('Saksoft Ltd', 'B 35-36 Sector 80 Noida-201305', '+91-120-2462175', 'www.saksoft.com', 'saksoft.com', true, 'Technology'),
('Scicom Technologies Pvt Ltd', 'A-67 Sector 57 Noida-201301', '+91.120.4343700', 'www.scicmp.com', 'scicmp.com', true, 'Technology'),
('SDG Software India Pvt Ltd', 'B-3 SDF NSEZ Noida-201305', '+91.120.2568791-5', 'www.sdgc.com', 'sdgc.com', true, 'Technology'),
('Shreema Software Solutions Pvt Ltd', '314 Vishal Chambers Sector 18 Noida-201301', '91-120-2514831/32', 'www.shreemasoft.com', 'shreemasoft.com', true, 'Technology'),
('Srishti Software Pvt Ltd', 'A-135 Ground Floor Sector 15 Noida-201301', '+91-9945239358', 'www.srishtisoft.com', 'srishtisoft.com', true, 'Technology'),
('ST Microelectronics Ltd', 'Plot 2 & 3 Sector 16A Noida-201301', NULL, 'www.st.com/stonline', 'st.com', true, 'Technology'),
('Syncata India Pvt Ltd', 'Tower C 1st Floor Logix Technopark Sector 127 Noida-201301', '+91-120-4268509-12', NULL, 'syncata.com', true, 'Technology'),
('Synopsys India Pvt Ltd', 'A-4 & 5 Logix Park Sector 16 Noida-201301', '91-120-2476500', 'www.synopsys.com', 'synopsys.com', true, 'Technology'),
('Tata Consultancy Services Ltd', 'D4 Sector 3 Noida-201301', '91-120-2531622-25', 'www.tcs.com', 'tcs.com', true, 'Technology'),
('Tech Mahindra Ltd', 'B-26 Sector 57 Noida-201301', '+91 120 4032700', 'www.mahindrabt.com', 'techmahindra.com', true, 'Technology'),
('TechSpan India Ltd', 'D-4 Sector 59 Noida-201307', '+91-120-4074000', 'www.headstrong.com', 'headstrong.com', true, 'Technology'),
('Thomson Digital (ITES) NSEZ', 'B/10-12 NSEZ Noida-201305', '+91-120-2562499/2563407', 'www.thomsondigital.com', 'thomsondigital.com', true, 'Technology'),
('UPTEC Computer Consultancy Ltd', 'C-10 Sector 10 Noida-201301', '0120-2544414/2544200/2532529', 'www.uptecnet.com', 'uptecnet.com', true, 'Technology'),
('Virage Logic International', 'A-75 Sector 57 Noida-201307', '+91-120-2588881-4', 'www.viragelogic.com', 'viragelogic.com', true, 'Technology'),
('Xansa India Ltd', 'C-2 Sector 1 Noida-201301', NULL, 'www.xansa.com', 'xansa.com', true, 'Technology'),
('Xcelore Private Limited', 'Office Number 15, 6th Floor, Tower-A, STELLAR IT PARK, C-25, C Block, Phase 2, Industrial Area, Sector 62, Noida, Uttar Pradesh 201309', '+91 81784 97981', 'https://xcelore.com/', 'xcelore.com', true, 'Technology')
ON CONFLICT (name) DO UPDATE SET
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  website = EXCLUDED.website,
  domain = EXCLUDED.domain,
  verified = EXCLUDED.verified,
  industry = EXCLUDED.industry,
  updated_at = NOW();

-- Verify the insert
SELECT COUNT(*) as total_companies FROM companies;





