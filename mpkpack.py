import csv
import sys
import os
import struct
import io

def round_to_2kb(par):
    return ((par // 2048) + (0 if (par % 2048) == 0 else 1)) * 2048

print("                M P K P A C K")
print("\"Couldn't have done it better myself.\" --Phil Katz")

if len(sys.argv) != 3:
    print("Usage: mpkpack.py <tocfile> <output path>")
    print("Example: mpkpack.py c0data_toc.csv c0data.mpk")
    sys.exit(0)

tocfilename = sys.argv[1]
outputpath = sys.argv[2]

print("Please don't touch any inputs while I work, or feed me invalid ones")
print(" or I *will* break horribly")

entries = []

print("Reading TOC...")
with io.open(tocfilename, 'r') as f:
    reader = csv.reader(f)
    for row in reader:
        if row[0].startswith('#'):
            continue
        entry = {
            'id': int(row[0]),
            'filename_on_disk': row[1],
            'filename_in_archive': row[2]
        }
        entries.append(entry)

with io.open(outputpath, 'wb') as f:
    print("Writing header...")
    magic = b'MPK\0'
    ver = b'\x00\x00\x02\x00'
    f.write(magic)
    f.write(ver)
    count = struct.pack("<Q", len(entries))
    f.write(count)
    
    pos = round_to_2kb(0x40 + len(entries) * 0x100)
    print("Writing files...")
    for entry in entries:
        print("[{0}] '{1}' => '{2}' ...".format(entry["id"], entry["filename_on_disk"], entry["filename_in_archive"]))
        f.seek(pos, os.SEEK_SET)
        entry["offset"] = pos
        with io.open(entry["filename_on_disk"], 'rb') as infile:
            while True:
                buf = infile.read(io.DEFAULT_BUFFER_SIZE)
                if not buf:
                    break
                f.write(buf)
            entry["filesize"] = infile.tell()
        pos = round_to_2kb(pos + entry["filesize"])
    
    i = 0
    print("Writing TOC...")
    for entry in entries:
        f.seek(0x40 + (i * 0x100), os.SEEK_SET)
        f.seek(0x4, os.SEEK_CUR)  # Skip compression field (always 0 for us)
        id = struct.pack("<L", entry["id"])
        f.write(id)
        offset = struct.pack("<Q", entry["offset"])
        f.write(offset)
        filesize = struct.pack("<Q", entry["filesize"])
        f.write(filesize)  # Compressed size
        f.write(filesize)  # Uncompressed size
        # I'm not sure whether the null terminator is necessary
        # so let's just ensure there always is one
        filename = entry["filename_in_archive"].encode('ascii')[:(0xE0 - 1)]
        f.write(filename)
        i += 1
        
print("Done writing " + outputpath)