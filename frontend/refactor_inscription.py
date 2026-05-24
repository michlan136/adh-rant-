import re

with open(r"C:\stage_projet\frontend\src\components\admin\InscriptionForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove hardcoded constants
content = re.sub(r"const FORMES_JURIDIQUES = \[.*?\];\n\n", "", content, flags=re.DOTALL)
content = re.sub(r"const SERVICES_CATEGORIES = \{.*?\};\n\n", "", content, flags=re.DOTALL)

# Add states for dynamic data
states_to_add = """  const [villes, setVilles] = useState<any[]>([]);
  const [formesJuridiques, setFormesJuridiques] = useState<any[]>([]);
  const [chiffresAffaires, setChiffresAffaires] = useState<any[]>([]);
  const [effectifs, setEffectifs] = useState<any[]>([]);
  const [servicesCategories, setServicesCategories] = useState<Record<string, any[]>>({});
  const [servicesDemandes, setServicesDemandes] = useState<Record<string, number[]>>({});"""

content = content.replace("  const [servicesDemandes, setServicesDemandes] = useState<string[]>([]);", states_to_add)

# Update the useEffect
use_effect_replacement = """  useEffect(() => {
    fetchWithAuth('/api/admin/evenements').then((data) => setEvenements(data)).catch(() => setEvenements([]));
    fetchWithAuth('/api/referentiels/villes').then((data) => setVilles(data)).catch(() => setVilles([]));
    fetchWithAuth('/api/referentiels/formes-juridiques').then((data) => setFormesJuridiques(data)).catch(() => setFormesJuridiques([]));
    fetchWithAuth('/api/referentiels/chiffres-affaires').then((data) => setChiffresAffaires(data)).catch(() => setChiffresAffaires([]));
    fetchWithAuth('/api/referentiels/effectifs').then((data) => setEffectifs(data)).catch(() => setEffectifs([]));
    fetchWithAuth('/api/referentiels/services').then((data) => setServicesCategories(data)).catch(() => setServicesCategories({}));
  }, []);"""

content = re.sub(r"  useEffect\(\(\) => \{.*?  \}, \[\]\);", use_effect_replacement, content, flags=re.DOTALL)

# Change formData initial state for IDs
content = content.replace("ville: '',", "ville_id: '',")
content = content.replace("chiffreAffaires: '',", "ca_id: '',")
content = content.replace("effectif: '',", "effectif_id: '',")

# Modify handleCheckboxChange
checkbox_change = """  const handleCheckboxChange = (category: string, id: number) => {
    setServicesDemandes((prev) => {
      const currentList = prev[category] || [];
      const isSelected = currentList.includes(id);
      return {
        ...prev,
        [category]: isSelected ? currentList.filter(item => item !== id) : [...currentList, id]
      };
    });
  };"""
content = re.sub(r"  const handleCheckboxChange = \(service: string\) => \{.*?  \};\n", checkbox_change + "\n", content, flags=re.DOTALL)

# Modify the payload sent to backend
payload_replacements = {
    "ville: formData.ville,": "ville_id: formData.ville_id ? parseInt(formData.ville_id) : null,",
    "chiffre_affaires: formData.chiffreAffaires || null,": "ca_id: formData.ca_id ? parseInt(formData.ca_id) : null,",
    "effectif: formData.effectif || null,": "effectif_id: formData.effectif_id ? parseInt(formData.effectif_id) : null,",
    "forme_juridique: formeJuridique,": "forme_juridique_id: formesJuridiques.find(f => f.titre === formeJuridique)?.id || null,"
}

for k, v in payload_replacements.items():
    content = content.replace(k, v)

# Now update the UI inputs:
# Forme Juridique
ui_fj = """              <select
                value={formeJuridique}
                onChange={(e) => setFormeJuridique(e.target.value)}
                style={selectStyle}
                required
              >
                <option value="Sélectionner...">Sélectionner...</option>
                {formesJuridiques.map((forme: any) => (
                  <option key={forme.id} value={forme.titre}>{forme.titre}</option>
                ))}
              </select>"""
content = re.sub(r"              <select\n                value=\{formeJuridique\}.*?              </select>", ui_fj, content, flags=re.DOTALL)

# Ville
ui_ville = """<div className="form-group"><label>Ville</label><select name="ville_id" value={formData.ville_id} onChange={handleInputChange} style={selectStyle}><option value="">Sélectionner...</option>{villes.map((v:any) => <option key={v.id} value={v.id}>{v.titre}</option>)}</select></div>"""
content = re.sub(r'<div className="form-group"><label>Ville</label><input type="text" name="ville" value=\{formData.ville\} onChange=\{handleInputChange\} /></div>', ui_ville, content)

# CA
ui_ca = """                      <select name="ca_id" value={formData.ca_id} onChange={handleInputChange} style={selectStyle}>
                        <option value="">Sélectionner...</option>
                        {chiffresAffaires.map((ca:any) => <option key={ca.id} value={ca.id}>{ca.titre}</option>)}
                      </select>"""
content = re.sub(r'                      <select name="chiffreAffaires" value=\{formData.chiffreAffaires\}.*?                      </select>', ui_ca, content, flags=re.DOTALL)

# Effectif
ui_eff = """                      <select name="effectif_id" value={formData.effectif_id} onChange={handleInputChange} style={selectStyle}>
                        <option value="">Sélectionner...</option>
                        {effectifs.map((e:any) => <option key={e.id} value={e.id}>{e.titre}</option>)}
                      </select>"""
content = re.sub(r'                      <select name="effectif" value=\{formData.effectif\}.*?                      </select>', ui_eff, content, flags=re.DOTALL)

# Services
ui_services = """                  {Object.entries(servicesCategories).map(([category, services]) => (
                    <div key={category} style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>{category}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {services.map((service: any) => (
                          <label key={service.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={(servicesDemandes[category.toLowerCase().replace(' ', '_')] || []).includes(service.id)}
                              onChange={() => handleCheckboxChange(category.toLowerCase().replace(' ', '_'), service.id)}
                              style={{ marginTop: '2px', width: '15px', height: '15px', accentColor: 'var(--primary)' }}
                            />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{service.titre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}"""
content = re.sub(r"                  \{Object\.entries\(SERVICES_CATEGORIES\).*?                  \}\)\}", ui_services, content, flags=re.DOTALL)


with open(r"C:\stage_projet\frontend\src\components\admin\InscriptionForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Modification réussie")
