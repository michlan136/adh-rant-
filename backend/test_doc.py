import os
from dotenv import load_dotenv
import httpx
import base64

load_dotenv()

WHATSAPP_API_URL = os.environ.get("WHATSAPP_API_URL", "")
WHATSAPP_API_TOKEN = os.environ.get("WHATSAPP_API_TOKEN", "")

def test_send_doc():
    if not WHATSAPP_API_URL:
        print("No URL")
        return
        
    doc_url = WHATSAPP_API_URL.replace("/messages/chat", "/messages/document")
    to = "+212716277057"
    
    # Create a dummy text file
    with open("test.txt", "w") as f:
        f.write("Hello world!")
        
    with open("test.txt", "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
        
    data = {
        "token": WHATSAPP_API_TOKEN,
        "to": to,
        "document": b64,
        "filename": "test.txt"
    }
    
    resp = httpx.post(doc_url, data=data, headers={"content-type": "application/x-www-form-urlencoded"})
    print(resp.status_code)
    print(resp.text)

if __name__ == "__main__":
    test_send_doc()
