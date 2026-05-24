import re

with open(r"C:\stage_projet\frontend\src\components\admin\InscriptionForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

physique_spécifiques = """              {/* Informations spécifiques */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                      <i className="far fa-id-card"></i>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>2. Informations spécifiques (Personne Physique)</h3>
                  </div>

                  <div className="grid-2">
                    <div className="form-group"><label>CIN *</label><input type="text" name="cin" value={formData.cin} onChange={handleInputChange} required /></div>
                    <div className="form-group"><label>Date de naissance</label><input type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleInputChange} /></div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Profession / Fonction</label><input type="text" name="profession" value={formData.profession} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>N° Patente (Si applicable)</label><input type="text" name="numeroPatente" value={formData.numeroPatente} onChange={handleInputChange} /></div>
                  </div>
                  
                  <div className="grid-2" style={{ marginTop: 24, marginBottom: 24 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>ICE (Si auto-entrepreneur)</label><input type="text" name="ice" value={formData.ice} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Registre du Commerce (RC)</label><input type="text" name="rc" value={formData.rc} onChange={handleInputChange} /></div>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Activité</h4>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Activité principale</label><input type="text" name="activitePrincipale" value={formData.activitePrincipale} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Secteur d’activité</label><input type="text" name="secteurActivite" value={formData.secteurActivite} onChange={handleInputChange} /></div>
                  </div>
                </div>
              </div>"""

# Replace the Physique block
content = re.sub(r'              \{\/\* Informations spécifiques \*\/}(.*?)\<\/div\>\n              \<\/div\>', physique_spécifiques, content, count=1, flags=re.DOTALL)

# For Auto-entrepreneur, add the same fields but change title
auto_spécifiques = """              {/* Informations spécifiques */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                      <i className="far fa-id-card"></i>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>2. Informations spécifiques (Auto-entrepreneur)</h3>
                  </div>

                  <div className="grid-2">
                    <div className="form-group"><label>CIN *</label><input type="text" name="cin" value={formData.cin} onChange={handleInputChange} required /></div>
                    <div className="form-group"><label>Date de naissance</label><input type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleInputChange} /></div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Profession / Fonction</label><input type="text" name="profession" value={formData.profession} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>N° Patente (Si applicable)</label><input type="text" name="numeroPatente" value={formData.numeroPatente} onChange={handleInputChange} /></div>
                  </div>
                  
                  <div className="grid-2" style={{ marginTop: 24, marginBottom: 24 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>ICE</label><input type="text" name="ice" value={formData.ice} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Registre du Commerce (RC)</label><input type="text" name="rc" value={formData.rc} onChange={handleInputChange} /></div>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Activité</h4>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Activité principale</label><input type="text" name="activitePrincipale" value={formData.activitePrincipale} onChange={handleInputChange} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Numéro d’auto-entrepreneur</label><input type="text" name="numeroAutoEntrepreneur" value={formData.numeroAutoEntrepreneur} onChange={handleInputChange} /></div>
                  </div>
                  <div className="grid-2" style={{ marginTop: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>Secteur d’activité</label><input type="text" name="secteurActivite" value={formData.secteurActivite} onChange={handleInputChange} /></div>
                  </div>
                </div>
              </div>"""

# Replace the auto-entrepreneur block
# We need to find it in the content. It starts with `{/* ======================================================== */}\n          {/* 3. AUTO-ENTREPRENEUR */}`
parts = content.split("{/* 3. AUTO-ENTREPRENEUR */}")
if len(parts) == 2:
    sub_parts = parts[1].split("{/* 4. ASSOCIATION */}")
    if len(sub_parts) == 2:
        ae_content = sub_parts[0]
        ae_content = re.sub(r'              \{\/\* Informations spécifiques \*\/}(.*?)\<\/div\>\n              \<\/div\>', auto_spécifiques, ae_content, count=1, flags=re.DOTALL)
        content = parts[0] + "{/* 3. AUTO-ENTREPRENEUR */}" + ae_content + "{/* 4. ASSOCIATION */}" + sub_parts[1]

# I also need to remove CIN from Informations de base for Physique and Auto-entrepreneur so it's not duplicated
content = re.sub(r'<div className="form-group"><label>CIN \*</label><input type="text" name="cin" value=\{formData.cin\} onChange=\{handleInputChange\} required /></div>', "", content)

with open(r"C:\stage_projet\frontend\src\components\admin\InscriptionForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fields added successfully.")
