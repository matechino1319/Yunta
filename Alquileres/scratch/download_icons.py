import os
import requests

icons = {
    'vqdwwruu': 'dashboard',
    'osuxyevn': 'tiendas',
    'ljvqlqoe': 'usuarios',
    'pkvdaisw': 'reportes',
    'qhviklyi': 'pagos',
    'vspbqszr': 'alertas',
    'pdwpcpwt': 'checklist',
    'mndmqmbe': 'calculadora',
    'gqzfzudq': 'ipc',
    'rvivpajp': 'servidor',
    'lupuorrc': 'refresh',
    'fpipqvno': 'archivados',
    'drxqzxhx': 'vaciar',
    'jxwttvbe': 'logout'
}

os.makedirs('icons', exist_ok=True)

# Descargar librería
print("Descargando lordicon.js...")
try:
    r = requests.get('https://cdn.lordicon.com/lordicon.js')
    with open('lordicon.js', 'wb') as f:
        f.write(r.content)
except Exception as e:
    print(f"Error descargando librería: {e}")

# Descargar iconos
for cid, name in icons.items():
    print(f"Descargando {name}.json...")
    url = f"https://cdn.lordicon.com/{cid}.json"
    try:
        r = requests.get(url)
        with open(f'icons/{name}.json', 'wb') as f:
            f.write(r.content)
    except Exception as e:
        print(f"Error descargando {name}: {e}")

print("¡Listo!")
