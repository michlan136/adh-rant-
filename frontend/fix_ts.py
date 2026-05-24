import os

with open(r"C:\stage_projet\frontend\src\components\admin\InscriptionForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix the import
content = content.replace("import { fetchWithAuth } from '@/utils/api';", "import { fetchWithAuth } from '@/lib/api';")
content = content.replace("import FileUploader from './FileUploader';\n", "")

# 2. Re-introduce the DOCUMENTS_REQUIS from backup
doc_requis = """const DOCUMENTS_REQUIS: Record<string, { docs: string[], frais: string[] }> = {
  'Personne physique': {
    docs: ['Registre de commerce (original)', 'Taxe professionnelle (original)', 'Copie de la CNI', 'Photo d’identité'],
    frais: ['100 DH (carte professionnelle)', '100 DH (attestation d’exercice)', '500 DH (carte d’adhésion)']
  },
  'Société': {
    docs: ['Statuts de la société (original)', 'Registre de commerce Modèle J (original)', 'Taxe professionnelle (original)', 'Copie de la CNI', 'Photo d’identité'],
    frais: ['300 DH (carte professionnelle)', '200 DH (attestation d\\'exercice)', '1000 DH (SARL) ou 2000 DH (SA) pour l\\'adhésion']
  },
  'Auto-entrepreneur': {
    docs: ['Copie de la CNI', 'Copie de la carte d’auto-entrepreneur', 'Photo d’identité', 'Taxe professionnelle'],
    frais: ['100 DH (attestation d’exercice)']
  },
  'Association': {
    docs: ['Statuts de l’association', 'Liste des membres du bureau', 'Récépissé de dépôt final', 'Procès-verbal de la dernière AG', 'Copie de la CNI du responsable', 'Photo d’identité'],
    frais: []
  }
};"""

content = content.replace("export default function InscriptionForm", f"{doc_requis}\n\nexport default function InscriptionForm")

# 3. Re-introduce docFiles state
content = content.replace("const [submitting, setSubmitting] = useState(false);", "const [submitting, setSubmitting] = useState(false);\n  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});")

# 4. Re-introduce handleSubmit upload logic
upload_logic = """    try {
      for (const [docName, file] of Object.entries(docFiles)) {
        if (file) {
          const fd = new FormData();
          fd.append('file', file);
          const upRes = await fetch('/api/admin/upload-doc', { method: 'POST', body: fd });
          if (upRes.ok) {
            const data = await upRes.json();
            uploadedUrls[docName] = data.filepath;
          }
        }
      }
    } catch (err) {
      console.error("Erreur upload", err);
      alert("Erreur lors du téléversement des documents.");
      setSubmitting(false);
      return;
    }"""

content = content.replace("const payload = {", f"const uploadedUrls: Record<string, string> = {{}};\n{upload_logic}\n\n    const payload = {{")
content = content.replace("documents: JSON.stringify(uploadedUrls),", "documents: JSON.stringify(uploadedUrls),") # keep it but ensure uploadedUrls comes from the local var

# 5. Replace the whole "DOCUMENTS REQUIS" block with the dynamic one from backup
# I'll just use regex or split to replace the block
start_marker = "{/* ======================================================== */}\n          {/* DOCUMENTS REQUIS (Commun avec variables) */}\n          {/* ======================================================== */}"
end_marker = "{/* ======================================================== */}\n          {/* ÉVÉNEMENTS DISPONIBLES */}"

parts = content.split(start_marker)
if len(parts) == 2:
    parts2 = parts[1].split(end_marker)
    if len(parts2) == 2:
        new_doc_block = """
          {/* DOCUMENTS REQUIS */}
          {formeJuridique !== 'Sélectionner...' && formeJuridique !== 'Autre' && DOCUMENTS_REQUIS[formeJuridique] && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 32, height: 32, background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                    <i className="fas fa-file-invoice"></i>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Documents Requis et Frais</h3>
                </div>

                <div className="grid-2" style={{ gap: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Documents à importer</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {DOCUMENTS_REQUIS[formeJuridique].docs.map((docName: string) => (
                        <div key={docName}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{docName} *</label>
                          <input 
                            type="file" 
                            required
                            onChange={(e) => setDocFiles({...docFiles, [docName]: e.target.files ? e.target.files[0] : null})}
                            style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px dashed var(--border)', fontSize: 13 }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Frais d'inscription</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {DOCUMENTS_REQUIS[formeJuridique].frais.map((frais: string, idx: number) => (
                        <li key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{frais}</li>
                      ))}
                      {DOCUMENTS_REQUIS[formeJuridique].frais.length === 0 && (
                        <li style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Aucun frais pour cette forme juridique.</li>
                      )}
                    </ul>
                    <div style={{ marginTop: '20px', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                      <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-info-circle"></i> Note d'information
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#92400e' }}>
                        Veuillez fournir les justificatifs demandés. Les documents originaux peuvent être demandés lors du retrait de la carte.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          """
        content = parts[0] + new_doc_block + end_marker + parts2[1]

# Remove the uploadedUrls state since it's local to handleSubmit now
content = content.replace("const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});\n", "")

with open(r"C:\stage_projet\frontend\src\components\admin\InscriptionForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("TypeScript errors fixed.")
