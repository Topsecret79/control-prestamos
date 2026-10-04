import subprocess, json, urllib.request, urllib.error, os

print("Obteniendo credenciales de Git Credential Manager...")
p = subprocess.Popen(['git', 'credential', 'fill'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
stdout, _ = p.communicate(input="protocol=https\nhost=github.com\n")
cred = {}
for line in stdout.splitlines():
    if '=' in line:
        k, v = line.split('=', 1)
        cred[k.strip()] = v.strip()

token = cred.get('password')
user = cred.get('username', 'Topsecret79')
print(f"Usuario: {user}, Token disponible: {bool(token)}")

if not token:
    print("Error: No se encontró token en Git Credential Manager")
    exit(1)

headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'AntigravityDeployer'
}

repo_name = 'control-prestamos'
print(f"Creando repositorio '{repo_name}' en GitHub si no existe...")
req = urllib.request.Request('https://api.github.com/user/repos', data=json.dumps({
    'name': repo_name,
    'description': 'Control de Préstamos y Adelantos (PrestApp) - Aplicación móvil 100% gratuita con sumatorios diarios y mensuales y reportes por WhatsApp',
    'auto_init': False,
    'private': False
}).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req) as resp:
        print(f"Repositorio creado con código: {resp.status}")
except urllib.error.HTTPError as e:
    err_body = e.read().decode('utf-8')
    if e.code == 422 and 'already exists' in err_body:
        print("El repositorio ya existía en GitHub.")
    else:
        print(f"Respuesta creación repo ({e.code}): {err_body}")

# Configurar git local y hacer push
print("Preparando commit y push...")
subprocess.run(['git', 'init'])
subprocess.run(['git', 'config', 'user.name', user])
subprocess.run(['git', 'config', 'user.email', 'topsecret79@users.noreply.github.com'])
subprocess.run(['git', 'add', '.'])
subprocess.run(['git', 'commit', '-m', 'Despliegue de Control de Prestamos y Adelantos (PrestApp)'])
subprocess.run(['git', 'branch', '-M', 'main'])

# Configurar remote con el token directamente para garantizar push sin pedir credenciales
remote_url = f'https://{user}:{token}@github.com/{user}/{repo_name}.git'
subprocess.run(['git', 'remote', 'remove', 'origin'], stderr=subprocess.DEVNULL)
subprocess.run(['git', 'remote', 'add', 'origin', remote_url])

push_res = subprocess.run(['git', 'push', '-u', 'origin', 'main', '--force'])
print(f"Resultado del push: {push_res.returncode}")

# Habilitar GitHub Pages
print("Habilitando GitHub Pages...")
pages_url = f'https://api.github.com/repos/{user}/{repo_name}/pages'
req_pages = urllib.request.Request(pages_url, data=json.dumps({
    'source': { 'branch': 'main', 'path': '/' }
}).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req_pages) as resp:
        print(f"GitHub Pages activado: {resp.status}")
except urllib.error.HTTPError as e:
    err_body = e.read().decode('utf-8')
    if 'already has a GitHub Pages site' in err_body:
        print("GitHub Pages ya estaba activado.")
    else:
        print(f"Pages status ({e.code}): {err_body}")

url = f"https://{user.lower()}.github.io/{repo_name}/"
print(f"\n¡ÉXITO TOTAL! La URL oficial en GitHub Pages es: {url}")
