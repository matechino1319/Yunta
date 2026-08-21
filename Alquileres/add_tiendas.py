import json
import time
with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

new_tiendas = [
    {
        "ajuste": "Anual",
        "cauFin": "2026-12-31",
        "cauIni": "",
        "cont": "",
        "dep": 0,
        "diapago": 10,
        "dir": "",
        "fraFin": "",
        "fraIni": "",
        "id": "t" + str(int(time.time() * 1000) + 1),
        "indice": "ICL",
        "ini": "",
        "irreg": "Hoja no encontrada",
        "locFin": "",
        "locIni": "",
        "monto": 0,
        "nombre": "Maza",
        "obs": "Agregado para seguimiento de caución",
        "prop": "",
        "razon": "",
        "resp": "",
        "subFin": "",
        "subIni": "",
        "tipo": "SUCURSAL"
    },
    {
        "ajuste": "Anual",
        "cauFin": "2026-12-31",
        "cauIni": "",
        "cont": "",
        "dep": 0,
        "diapago": 10,
        "dir": "",
        "fraFin": "",
        "fraIni": "",
        "id": "t" + str(int(time.time() * 1000) + 2),
        "indice": "ICL",
        "ini": "",
        "irreg": "Hoja no encontrada",
        "locFin": "",
        "locIni": "",
        "monto": 0,
        "nombre": "General Alvear",
        "obs": "Agregado para seguimiento de caución",
        "prop": "",
        "razon": "",
        "resp": "",
        "subFin": "",
        "subIni": "",
        "tipo": "SUCURSAL"
    },
    {
        "ajuste": "Anual",
        "cauFin": "2026-12-31",
        "cauIni": "",
        "cont": "",
        "dep": 0,
        "diapago": 10,
        "dir": "",
        "fraFin": "",
        "fraIni": "",
        "id": "t" + str(int(time.time() * 1000) + 3),
        "indice": "ICL",
        "ini": "",
        "irreg": "",
        "locFin": "2026-12-31",
        "locIni": "",
        "monto": 0,
        "nombre": "Atuel Norte",
        "obs": "Agregado desde Excel. Todo en orden.",
        "prop": "",
        "razon": "",
        "resp": "",
        "subFin": "2026-12-31",
        "subIni": "",
        "tipo": "SUCURSAL"
    }
]

data['TIENDAS'].extend(new_tiendas)

with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print('Agregadas 3 tiendas a data.json')
