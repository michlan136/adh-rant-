import httpx
import asyncio

async def test_refs():
    async with httpx.AsyncClient() as client:
        res = await client.get("http://127.0.0.1:8000/api/referentiels/services")
        print(res.json())

asyncio.run(test_refs())
