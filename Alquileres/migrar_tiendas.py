import json
import os

# Rutas
data_path = 'data.json'
consolidado_path = r'C:\Users\Yunta Licitaciones\.gemini\antigravity\brain\87c112b3-687f-49eb-bdb0-0803315ded74\scratch\consolidado_viejo.json'

# Cargar datos actuales
with open(data_path, 'r', encoding='utf-8') as f:
    current_data = json.load(f)

# Cargar datos viejos
with open(consolidado_path, 'r', encoding='utf-8') as f:
    viejo_data = json.load(f)

tiendas_excel = viejo_data.get('Registro Franquicias.xlsx', {}).get('DATOS TIENDAS', [])

# Mapeo de columnas (basado en el análisis previo)
# 1: Numero de tienda (LYxx)
# 2: TIENDA (Nombre)
# 3: UBICACION (Dirección)
# 4: TIPO
# 5: Departamento/Provincia
# 6: Propietario / Encargado
# 7: Correo
# 8: CUIT
# 9: m2

def clean(val):
    if val is None: return ""
    return str(val).strip()

header_found = False
count_updated = 0
count_added = 0

tiendas_actuales = current_data.get('TIENDAS', [])

for row in tiendas_excel:
    if not row or len(row) < 3: continue
    
    # Buscar el encabezado para saltar filas basurilla
    if "TIENDA" in str(row[2]) and not header_found:
        header_found = True
        continue
    if not header_found: continue
    
    num = clean(row[1])
    nombre = clean(row[2])
    ubicacion = clean(row[3])
    tipo = clean(row[4]).upper()
    depto = clean(row[5])
    prop = clean(row[6])
    correo = clean(row[7])
    cuit = clean(row[8])
    m2 = clean(row[9])
    
    if not nombre or nombre.lower() == 'tienda': continue
    
    # Buscar si ya existe por nombre
    target = next((t for t in tiendas_actuales if t['nombre'].lower() == nombre.lower()), None)
    
    if target:
        # Enriquecer
        if not target.get('num'): target['num'] = num
        if not target.get('depar'): target['depar'] = depto
        if not target.get('cuit'): target['cuit'] = cuit
        if not target.get('m2'): target['m2'] = m2
        # Fusionar correos si son distintos
        if correo and target.get('cont') != correo:
            if target.get('cont'):
                if correo.lower() not in target['cont'].lower():
                    target['cont'] = f"{target['cont']} / {correo}"
            else:
                target['cont'] = correo
        count_updated += 1
    else:
        # Crear nueva tienda
        nueva = {
            "id": "t" + num.replace("LY", "") if num.startswith("LY") else "t" + str(len(tiendas_actuales) + 1000),
            "nombre": nombre,
            "num": num,
            "depar": depto,
            "cuit": cuit,
            "m2": m2,
            "tipo": tipo if tipo in ["SUCURSAL", "FRANQUICIA"] else "FRANQUICIA",
            "prop": prop,
            "razon": "",
            "dir": ubicacion,
            "resp": "",
            "cont": correo,
            "locIni": "", "locFin": "", "subIni": "", "subFin": "",
            "cauIni": "", "cauFin": "", "fraIni": "", "fraFin": "",
            "ini": "", "monto": 0, "ajuste": "Semestral", "indice": "IPC Nacional",
            "dep": 0, "diapago": 10, "irreg": "", "obs": ""
        }
        tiendas_actuales.append(nueva)
        count_added += 1

current_data['TIENDAS'] = tiendas_actuales

# Guardar cambios
with open(data_path, 'w', encoding='utf-8') as f:
    json.dump(current_data, f, indent=2, ensure_ascii=False)

print(f"Migración completada:")
print(f"- Tiendas actualizadas: {count_updated}")
print(f"- Tiendas nuevas agregadas: {count_added}")
