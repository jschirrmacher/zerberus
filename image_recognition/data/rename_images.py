# Rename all images which simply have a single number to a better name
from os import listdir, rename
from os.path import isfile, join
import random
import string
import re

to_replace_filter = r"^\d+\.jpg"
dir_path = r"./all_images/"
files = [f for f in listdir(dir_path) if isfile(join(dir_path, f))]
base_name = input("Base file name:")
count = 0
for file in files:
    if re.search(to_replace_filter, file):
        count += 1
        rename(dir_path + file, dir_path + base_name + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6)) + ".png")
print("Renamed ", count, " out of ", len(files))
print("Finished renaming")