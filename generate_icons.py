import struct
import zlib
import os
import math

def create_png(width, height, draw_fn, filename):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0
        for x in range(width):
            r, g, b, a = draw_fn(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png.extend(struct.pack('>I', len(ihdr_data)))
    png.extend(b'IHDR')
    png.extend(ihdr_data)
    png.extend(struct.pack('>I', ihdr_crc))
    
    # IDAT
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png.extend(struct.pack('>I', len(compressed)))
    png.extend(b'IDAT')
    png.extend(compressed)
    png.extend(struct.pack('>I', idat_crc))
    
    # IEND
    iend_crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0))
    png.extend(b'IEND')
    png.extend(struct.pack('>I', iend_crc))
    
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Created {filename} ({width}x{height})")

def draw_icon(x, y, w, h):
    nx = x / float(w)
    ny = y / float(h)
    
    # Rounded corners (squircle)
    corner_r = 0.22
    dx = 0.0
    if nx < corner_r: dx = corner_r - nx
    elif nx > 1.0 - corner_r: dx = nx - (1.0 - corner_r)
    
    dy = 0.0
    if ny < corner_r: dy = corner_r - ny
    elif ny > 1.0 - corner_r: dy = ny - (1.0 - corner_r)
    
    if (dx*dx + dy*dy) > corner_r*corner_r:
        return (0, 0, 0, 0) # Transparent outside
    
    # Background gradient: Slate dark (#0a0e1a to #141c30)
    bg_r = int(10 + ny * 10)
    bg_g = int(14 + ny * 14)
    bg_b = int(26 + ny * 22)

    cx, cy = 0.5, 0.5
    dist_center = math.sqrt((nx - cx)**2 + (ny - cy)**2)
    
    # Anillo exterior esmeralda (adelantos / finanzas)
    if 0.35 <= dist_center <= 0.39:
        return (16, 185, 129, 255) # Emerald
    
    # Moneda dorada central
    if dist_center <= 0.30:
        # Borde brillante
        if dist_center >= 0.27:
            return (254, 243, 199, 255) # Light gold border
        
        # Cara interior de la moneda: gradiente dorado
        coin_ny = (ny - (cy - 0.27)) / 0.54
        c_r = int(251 - coin_ny * 35)
        c_g = int(191 - coin_ny * 70)
        c_b = int(36 - coin_ny * 30)
        
        # Dibujar símbolo de Euro (€) simplificado
        # Arco exterior: radio 0.14 centrado en 0.53, 0.50
        ecx, ecy = 0.53, 0.50
        e_dist = math.sqrt((nx - ecx)**2 + (ny - ecy)**2)
        
        is_c_arc = (0.09 <= e_dist <= 0.15) and (nx <= 0.56 or math.atan2(ny - ecy, nx - ecx) < -0.8 or math.atan2(ny - ecy, nx - ecx) > 0.8)
        is_bar1 = (0.39 <= nx <= 0.57) and (0.45 <= ny <= 0.49)
        is_bar2 = (0.39 <= nx <= 0.57) and (0.51 <= ny <= 0.55)
        
        if is_c_arc or is_bar1 or is_bar2:
            return (11, 15, 25, 255) # Euro dark glyph
            
        return (c_r, c_g, c_b, 255)
        
    return (bg_r, bg_g, bg_b, 255)

if __name__ == '__main__':
    os.makedirs('icons', exist_ok=True)
    create_png(192, 192, draw_icon, 'icons/icon-192.png')
    create_png(512, 512, draw_icon, 'icons/icon-512.png')
    print("Icons successfully generated!")
