import os

# Create the kaggle config folder
os.makedirs('/root/.kaggle', exist_ok=True)

# Write your credentials directly — paste YOUR token here
os.environ['KAGGLE_TOKEN'] = 'KGAT_506cf0bd8f2b7bdedbc3d435ffd96fb4'

# Write the kaggle.json file manually
with open('/root/.kaggle/kaggle.json', 'w') as f:
    f.write('{"username":"Hasara Wimalasena","key":"KGAT_506cf0bd8f2b7bdedbc3d435ffd96fb4"}')

os.system(f"""chmod 600 /root/.kaggle/kaggle.json""")
os.system(f"""pip install -q kaggle""")

# Test it works
os.system(f"""kaggle datasets list --max-size 1""")
print("✅ Kaggle ready!")

import os

os.makedirs('/content/lits/volumes',       exist_ok=True)
os.makedirs('/content/lits/segmentations', exist_ok=True)

print("⬇️ Downloading 30 matched pairs (~7GB)...")
print("This takes about 15-20 minutes — do not close this tab\n")

for i in range(30):
    print(f"  Downloading pair {i+1}/30 ...", end='\r')

    os.system(f"""kaggle datasets download andrewmvd/liver-tumor-segmentation \
        -f volumes/volume-{i}.nii \
        -p /content/lits/volumes/ \
        --unzip -q""")

    os.system(f"""kaggle datasets download andrewmvd/liver-tumor-segmentation \
        -f segmentations/segmentation-{i}.nii \
        -p /content/lits/segmentations/ \
        --unzip -q""")

print("\n✅ All 30 pairs downloaded!")

import glob, os

volumes       = sorted(glob.glob('/content/lits/volumes/*.nii'))
segmentations = sorted(glob.glob('/content/lits/segmentations/*.nii'))

print(f"Volumes found:       {len(volumes)}")
print(f"Segmentations found: {len(segmentations)}")

# Match them
def get_id(f):
    return os.path.basename(f).split('-')[-1].split('.')[0]

data_list = []
for vol in volumes:
    vid   = get_id(vol)
    match = [s for s in segmentations if get_id(s) == vid]
    if match:
        data_list.append({"image": vol, "label": match[0]})

print(f"Matched pairs:       {len(data_list)}")
print("\nFirst 3 pairs:")
for pair in data_list[:3]:
    print(f"  {os.path.basename(pair['image'])}  ←→  {os.path.basename(pair['label'])}")

import os

# Check if lits folder exists and what's in it
print("📁 Contents of /content/lits/:")
for root, dirs, files in os.walk('/content/lits'):
    level = root.replace('/content/lits', '').count(os.sep)
    indent = ' ' * 2 * level
    print(f"{indent}{os.path.basename(root)}/")
    subindent = ' ' * 2 * (level + 1)
    for f in sorted(files)[:5]:
        print(f"{subindent}{f}")
    if len(files) > 5:
        print(f"{subindent}... and {len(files)-5} more")

import os
import zipfile
import glob

# Unzip all segmentation zips
seg_zips = glob.glob('/content/lits/segmentations/*.zip')
print(f"Found {len(seg_zips)} segmentation zips — unzipping...")

for zf in seg_zips:
    with zipfile.ZipFile(zf, 'r') as z:
        z.extractall('/content/lits/segmentations/')
    os.remove(zf)  # delete zip after extracting

print("✅ Segmentations unzipped!")

# Unzip all volume zips
vol_zips = glob.glob('/content/lits/volumes/*.zip') + \
           glob.glob('/content/lits/volume_pt1/*.zip') + \
           glob.glob('/content/lits/volume_pt2/*.zip') + \
           glob.glob('/content/lits/volume_pt3/*.zip') + \
           glob.glob('/content/lits/volume_pt4/*.zip') + \
           glob.glob('/content/lits/volume_pt5/*.zip')

print(f"Found {len(vol_zips)} volume zips — unzipping...")

for zf in vol_zips:
    folder = os.path.dirname(zf)
    with zipfile.ZipFile(zf, 'r') as z:
        z.extractall(folder)
    os.remove(zf)

print("✅ Volumes unzipped!")

import os

print("📁 Full contents of /content/lits/:")
for root, dirs, files in os.walk('/content/lits'):
    level = root.replace('/content/lits', '').count(os.sep)
    indent = ' ' * 2 * level
    print(f"{indent}{os.path.basename(root)}/")
    subindent = ' ' * 2 * (level + 1)
    for f in sorted(files)[:5]:
        print(f"{subindent}{f}")
    if len(files) > 5:
        print(f"{subindent}... and {len(files)-5} more")

os.system(f"""kaggle datasets files andrewmvd/liver-tumor-segmentation | head -30""")

import os
os.makedirs('/content/lits/volumes', exist_ok=True)

print("⬇️ Downloading 30 volumes one by one...")

for i in range(30):
    print(f"  Downloading volume-{i}... ({i+1}/30)", end='\r')
    os.system(f"""kaggle datasets download andrewmvd/liver-tumor-segmentation \
        -f \"volumes/volume-{i}.nii\" \
        -p /content/lits/volumes/ \
        --unzip -q""")

print("\n✅ All volumes downloaded!")

import glob, os

volumes       = sorted(glob.glob('/content/lits/volumes/*.nii'))
segmentations = sorted(glob.glob('/content/lits/segmentations/*.nii'))

print(f"Volumes found:       {len(volumes)}")
print(f"Segmentations found: {len(segmentations)}")

def get_id(f):
    return os.path.basename(f).split('-')[-1].split('.')[0]

data_list = []
for vol in volumes:
    vid   = get_id(vol)
    match = [s for s in segmentations if get_id(s) == vid]
    if match:
        data_list.append({"image": vol, "label": match[0]})

print(f"Matched pairs:       {len(data_list)}")

import os, glob

# Search entire /content for any .nii files
print("🔍 Searching for all .nii files...")

all_nii = glob.glob('/content/**/*.nii', recursive=True)

print(f"Total .nii files found: {len(all_nii)}")
for f in sorted(all_nii)[:20]:
    print(" ", f)

import os
os.makedirs('/content/lits/volumes', exist_ok=True)

print("⬇️ Downloading volumes...")

for i in range(30):
    print(f"Downloading volume-{i} ({i+1}/30)...")
    os.system(f"""kaggle datasets download andrewmvd/liver-tumor-segmentation \
        -f \"volume_pt1/volume-{i}.nii\" \
        -p /content/lits/volumes/ \
        --unzip -q""")

    # Check if it downloaded
    if os.path.exists(f'/content/lits/volumes/volume-{i}.nii'):
        print(f"  ✅ volume-{i}.nii saved!")
    else:
        print(f"  ⚠️ volume-{i}.nii not found — trying other folder...")
        os.system(f"""kaggle datasets download andrewmvd/liver-tumor-segmentation \
            -f \"volume_pt2/volume-{i}.nii\" \
            -p /content/lits/volumes/ \
            --unzip -q""")
        os.system(f"""kaggle datasets download andrewmvd/liver-tumor-segmentation \
            -f \"volume_pt3/volume-{i}.nii\" \
            -p /content/lits/volumes/ \
            --unzip -q""")
        os.system(f"""kaggle datasets download andrewmvd/liver-tumor-segmentation \
            -f \"volume_pt4/volume-{i}.nii\" \
            -p /content/lits/volumes/ \
            --unzip -q""")
        os.system(f"""kaggle datasets download andrewmvd/liver-tumor-segmentation \
            -f \"volume_pt5/volume-{i}.nii\" \
            -p /content/lits/volumes/ \
            --unzip -q""")

print("\n✅ Done!")

import glob

volumes = sorted(glob.glob('/content/lits/volumes/*.nii'))
print(f"Volumes found: {len(volumes)}")
for v in volumes[:5]:
    print(" ", v)

import glob, os

# Check all possible volume locations
print("Checking all folders...")
for folder in ['volumes', 'volume_pt1', 'volume_pt2',
               'volume_pt3', 'volume_pt4', 'volume_pt5']:
    path = f'/content/lits/{folder}/'
    if os.path.exists(path):
        files = glob.glob(path + '*.nii')
        print(f"  {folder}/  →  {len(files)} .nii files")
    else:
        print(f"  {folder}/  →  folder does not exist")

os.system(f"""df -h /content""")

import os

for root, dirs, files in os.walk('/content/lits'):
    level = root.replace('/content/lits', '').count(os.sep)
    indent = ' ' * 2 * level
    print(f"{indent}{os.path.basename(root)}/")
    subindent = ' ' * 2 * (level + 1)
    for f in sorted(files)[:5]:
        size = os.path.getsize(os.path.join(root, f))
        print(f"{subindent}{f}  ({size/1024/1024:.1f} MB)")
    if len(files) > 5:
        print(f"{subindent}... and {len(files)-5} more files")

import os, zipfile, glob

vol_zips = sorted(glob.glob('/content/lits/volumes/*.zip'))
print(f"Found {len(vol_zips)} volume zips — unzipping...")

for i, zf in enumerate(vol_zips):
    print(f"  Unzipping {i+1}/{len(vol_zips)}: {os.path.basename(zf)}", end='\r')
    with zipfile.ZipFile(zf, 'r') as z:
        z.extractall('/content/lits/volumes/')
    os.remove(zf)  # delete zip after extracting

print("\n✅ All volumes unzipped!")

import os

# Search everywhere in /content for .nii files
print("🔍 Searching for all .nii files in /content...\n")

found = []
for root, dirs, files in os.walk('/content'):
    for file in files:
        if file.endswith('.nii') or file.endswith('.nii.gz'):
            full_path = os.path.join(root, file)
            found.append(full_path)
            print(full_path)

print(f"\nTotal .nii files found: {len(found)}")

import os, zipfile, glob

vol_zips = sorted(glob.glob('/content/lits/volumes/*.zip'))
print(f"Found {len(vol_zips)} volume zips — unzipping...")

for i, zf in enumerate(vol_zips):
    print(f"  Unzipping {i+1}/{len(vol_zips)}: {os.path.basename(zf)}", end='\r')
    with zipfile.ZipFile(zf, 'r') as z:
        z.extractall('/content/lits/volumes/')
    os.remove(zf)

print("\n✅ All volumes unzipped!")

import os, glob

# Check what is actually in volumes folder
print("Contents of /content/lits/volumes/:")
all_files = os.listdir('/content/lits/volumes/')
print(f"Total files: {len(all_files)}")
for f in sorted(all_files)[:10]:
    full_path = os.path.join('/content/lits/volumes/', f)
    size = os.path.getsize(full_path)
    print(f"  {f}  ({size/1024/1024:.1f} MB)")

import glob, os

volumes       = sorted(glob.glob('/content/lits/volumes/*.nii'))
segmentations = sorted(glob.glob('/content/lits/segmentations/*.nii'))

def get_id(f):
    return os.path.basename(f).split('-')[-1].split('.')[0]

data_list = []
for vol in volumes:
    vid   = get_id(vol)
    match = [s for s in segmentations if get_id(s) == vid]
    if match:
        data_list.append({"image": vol, "label": match[0]})

print(f"Volumes found:       {len(volumes)}")
print(f"Segmentations found: {len(segmentations)}")
print(f"Matched pairs:       {len(data_list)}")

import random
random.seed(42)
random.shuffle(data_list)

split      = int(len(data_list) * 0.8)
train_list = data_list[:split]
val_list   = data_list[split:]
print(f"✅ Train: {len(train_list)} | Val: {len(val_list)}")

os.system(f"""pip install -q monai""")
import torch, os, glob
import matplotlib.pyplot as plt
from monai.data import CacheDataset, DataLoader, pad_list_data_collate
from monai.networks.nets import UNet
from monai.networks.layers import Norm
from monai.losses import DiceCELoss
from monai.transforms import (
    Compose, LoadImaged, EnsureChannelFirstd,
    Orientationd, Spacingd, ScaleIntensityRanged,
    Lambdad, RandFlipd, RandRotate90d,
    ResizeWithPadOrCropd
)
print("✅ All imports done!")

train_pipeline = Compose([
    LoadImaged(keys=["image", "label"]),
    EnsureChannelFirstd(keys=["image", "label"]),
    Orientationd(keys=["image", "label"], axcodes="RAS"),
    Spacingd(keys=["image", "label"],
             pixdim=(1.5, 1.5, 2.0),
             mode=("bilinear", "nearest")),
    ScaleIntensityRanged(keys=["image"],
                         a_min=-175, a_max=250,
                         b_min=0.0,  b_max=1.0, clip=True),
    Lambdad(keys=["label"],
            func=lambda x: (x > 0).astype(float)),
    ResizeWithPadOrCropd(keys=["image", "label"],
                         spatial_size=(96, 96, 48)),
    RandFlipd(keys=["image", "label"], prob=0.5, spatial_axis=0),
    RandFlipd(keys=["image", "label"], prob=0.5, spatial_axis=1),
    RandRotate90d(keys=["image", "label"], prob=0.5, max_k=3),
])

val_pipeline = Compose([
    LoadImaged(keys=["image", "label"]),
    EnsureChannelFirstd(keys=["image", "label"]),
    Orientationd(keys=["image", "label"], axcodes="RAS"),
    Spacingd(keys=["image", "label"],
             pixdim=(1.5, 1.5, 2.0),
             mode=("bilinear", "nearest")),
    ScaleIntensityRanged(keys=["image"],
                         a_min=-175, a_max=250,
                         b_min=0.0,  b_max=1.0, clip=True),
    Lambdad(keys=["label"],
            func=lambda x: (x > 0).astype(float)),
    ResizeWithPadOrCropd(keys=["image", "label"],
                         spatial_size=(96, 96, 48)),
])
print("✅ Pipelines ready!")

train_ds     = CacheDataset(data=train_list, transform=train_pipeline,
                            cache_rate=0.0, num_workers=2)
train_loader = DataLoader(train_ds, batch_size=1, shuffle=True,
                          collate_fn=pad_list_data_collate)

val_ds       = CacheDataset(data=val_list, transform=val_pipeline,
                            cache_rate=0.0, num_workers=2)
val_loader   = DataLoader(val_ds, batch_size=1, shuffle=False,
                          collate_fn=pad_list_data_collate)

print(f"✅ Train: {len(train_ds)} | Val: {len(val_ds)}")
batch = next(iter(train_loader))
print(f"Batch image shape: {batch['image'].shape}")
print(f"Batch label shape: {batch['label'].shape}")

import os

os.makedirs('/content/lits', exist_ok=True)

print("⬇️ Downloading LiTS dataset...")
print("This will take 20-30 minutes — do not close the tab\n")

os.system(f"""kaggle datasets download -d andrewmvd/liver-tumor-segmentation \
    -p /content/lits/ \
    --unzip""")

print("\n✅ Done!")

os.system(f"""df -h /content""")

import os

print("📁 Folder structure:")
for root, dirs, files in os.walk('/content/lits'):
    level = root.replace('/content/lits', '').count(os.sep)
    indent = ' ' * 2 * level
    print(f"{indent}{os.path.basename(root)}/")
    subindent = ' ' * 2 * (level + 1)
    for f in sorted(files)[:5]:
        print(f"{subindent}{f}")
    if len(files) > 5:
        print(f"{subindent}... and {len(files)-5} more files")

import glob, os

# Collect all volumes from all pt folders
volumes = sorted(
    glob.glob('/content/lits/volume_pt1/*.nii') +
    glob.glob('/content/lits/volume_pt2/*.nii') +
    glob.glob('/content/lits/volume_pt3/*.nii') +
    glob.glob('/content/lits/volume_pt4/*.nii') +
    glob.glob('/content/lits/volume_pt5/*.nii')
)

# Collect all segmentations
segmentations = sorted(glob.glob('/content/lits/segmentations/*.nii'))

print(f"Volumes found:       {len(volumes)}")
print(f"Segmentations found: {len(segmentations)}")

# Match by ID number
def get_id(f):
    return os.path.basename(f).split('-')[-1].split('.')[0]

data_list = []
unmatched = []
for vol in volumes:
    vid   = get_id(vol)
    match = [s for s in segmentations if get_id(s) == vid]
    if match:
        data_list.append({"image": vol, "label": match[0]})
    else:
        unmatched.append(os.path.basename(vol))

print(f"Matched pairs:       {len(data_list)}")
if unmatched:
    print(f"Unmatched volumes:   {unmatched}")

print("\nFirst 3 matched pairs:")
for pair in data_list[:3]:
    print(f"  {os.path.basename(pair['image'])}  ←→  {os.path.basename(pair['label'])}")

os.system(f"""pip install -q monai""")

import torch, os, glob
import matplotlib.pyplot as plt
from monai.data import CacheDataset, DataLoader
from monai.networks.nets import UNet
from monai.networks.layers import Norm
from monai.losses import DiceCELoss
from monai.transforms import (
    Compose, LoadImaged, EnsureChannelFirstd,
    Orientationd, Spacingd, ScaleIntensityRanged,
    Lambdad, RandCropByPosNegLabeld, DivisiblePadd,
    RandFlipd, RandRotate90d
)

print("✅ All imports successful!")

import random
random.seed(42)
random.shuffle(data_list)

split      = int(len(data_list) * 0.8)   # 80% train, 20% val
train_list = data_list[:split]            # ~41 samples
val_list   = data_list[split:]            # ~10 samples

print(f"✅ Train samples: {len(train_list)}")
print(f"✅ Val samples:   {len(val_list)}")

from monai.transforms import SpatialPadd, ResizeWithPadOrCropd

train_pipeline = Compose([
    LoadImaged(keys=["image", "label"]),
    EnsureChannelFirstd(keys=["image", "label"]),
    Orientationd(keys=["image", "label"], axcodes="RAS"),
    Spacingd(keys=["image", "label"],
             pixdim=(1.5, 1.5, 2.0),
             mode=("bilinear", "nearest")),
    ScaleIntensityRanged(keys=["image"],
                         a_min=-175, a_max=250,
                         b_min=0.0,  b_max=1.0, clip=True),
    Lambdad(keys=["label"],
            func=lambda x: (x > 0).astype(float)),
    # Force every scan to exactly 96x96x48 — no more size mismatches
    ResizeWithPadOrCropd(keys=["image", "label"],
                         spatial_size=(96, 96, 48)),
    RandFlipd(keys=["image", "label"], prob=0.5, spatial_axis=0),
    RandFlipd(keys=["image", "label"], prob=0.5, spatial_axis=1),
    RandRotate90d(keys=["image", "label"], prob=0.5, max_k=3),
])

val_pipeline = Compose([
    LoadImaged(keys=["image", "label"]),
    EnsureChannelFirstd(keys=["image", "label"]),
    Orientationd(keys=["image", "label"], axcodes="RAS"),
    Spacingd(keys=["image", "label"],
             pixdim=(1.5, 1.5, 2.0),
             mode=("bilinear", "nearest")),
    ScaleIntensityRanged(keys=["image"],
                         a_min=-175, a_max=250,
                         b_min=0.0,  b_max=1.0, clip=True),
    Lambdad(keys=["label"],
            func=lambda x: (x > 0).astype(float)),
    # Same fixed size for validation
    ResizeWithPadOrCropd(keys=["image", "label"],
                         spatial_size=(96, 96, 48)),
])

print("✅ Pipeline fixed!")

from monai.data import pad_list_data_collate

train_ds     = CacheDataset(data=train_list, transform=train_pipeline,
                            cache_rate=0.0, num_workers=2)
train_loader = DataLoader(train_ds, batch_size=2, shuffle=True,
                          collate_fn=pad_list_data_collate)

val_ds       = CacheDataset(data=val_list, transform=val_pipeline,
                            cache_rate=0.0, num_workers=2)
val_loader   = DataLoader(val_ds, batch_size=1, shuffle=False,
                          collate_fn=pad_list_data_collate)

print(f"✅ Train loader: {len(train_ds)} samples")
print(f"✅ Val loader:   {len(val_ds)} samples")

batch = next(iter(train_loader))
print(f"Batch image shape: {batch['image'].shape}")
print(f"Batch label shape: {batch['label'].shape}")
# Expected: torch.Size([2, 1, 96, 96, 48])

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using: {device}")

model = UNet(
    spatial_dims=3,
    in_channels=1,
    out_channels=2,
    channels=(16, 32, 64, 128, 256),
    strides=(2, 2, 2, 2),
    num_res_units=2,
    norm=Norm.BATCH,
).to(device)

loss_fn   = DiceCELoss(sigmoid=True, to_onehot_y=True)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='min', factor=0.5,
    patience=10              # ← removed verbose=True
)

print("✅ Model ready!")

from google.colab import drive
drive.mount('/content/drive')

max_epochs   = 100
best_loss    = float('inf')
loss_history = []
val_history  = []

print(f"🚀 Training on {device} for {max_epochs} epochs...\n")

for epoch in range(max_epochs):

    # --- Training ---
    model.train()
    epoch_loss = 0.0
    steps      = 0

    for batch in train_loader:
        inputs = batch["image"].to(device)
        labels = batch["label"].to(device)

        optimizer.zero_grad()

        with torch.amp.autocast('cuda'):
            outputs = model(inputs)
            loss    = loss_fn(outputs, labels)

        loss.backward()
        optimizer.step()

        epoch_loss += loss.item()
        steps      += 1

    epoch_loss /= steps
    loss_history.append(epoch_loss)

    # Print every epoch so you can monitor progress
    if (epoch + 1) % 5 == 0:
        print(f"Epoch [{epoch+1:3d}/{max_epochs}]  Train Loss: {epoch_loss:.4f}")

    # --- Validation every 10 epochs ---
    if (epoch + 1) % 10 == 0:
        model.eval()
        val_loss  = 0.0
        val_steps = 0

        with torch.no_grad():
            for val_batch in val_loader:
                val_inputs = val_batch["image"].to(device)
                val_labels = val_batch["label"].to(device)

                with torch.amp.autocast('cuda'):
                    val_outputs = model(val_inputs)
                    v_loss      = loss_fn(val_outputs, val_labels)

                val_loss  += v_loss.item()
                val_steps += 1

        val_loss /= val_steps
        val_history.append(val_loss)
        scheduler.step(val_loss)

        print(f"          ↳ Val Loss:   {val_loss:.4f}")

        # Save best model to Drive
        if val_loss < best_loss:
            best_loss = val_loss
            torch.save(
                model.state_dict(),
                "/content/drive/MyDrive/best_unet_model.pth"
            )
            print("          ⭐ Best model saved to Drive!")

# --- Plot loss curve ---
plt.figure(figsize=(10, 4))
plt.plot(loss_history,
         label='Train Loss',
         color='steelblue',
         linewidth=1.5)
plt.plot(
    [i * 10 - 1 for i in range(1, len(val_history) + 1)],
    val_history,
    label='Val Loss',
    color='orange',
    marker='o',
    linewidth=1.5
)
plt.xlabel("Epoch")
plt.ylabel("DiceCE Loss")
plt.title("UNet — Training & Validation Loss")
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("/content/drive/MyDrive/unet_loss_curve.png", dpi=150)
plt.show()

print(f"\n✨ Training complete!")
print(f"   Best validation loss: {best_loss:.4f}")
print(f"   Model saved to Google Drive ✅")

import torch
print(f"GPU available: {torch.cuda.is_available()}")
print(f"Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'No GPU'}")

import glob

volumes = sorted(
    glob.glob('/content/lits/volume_pt1/*.nii') +
    glob.glob('/content/lits/volume_pt2/*.nii') +
    glob.glob('/content/lits/volume_pt3/*.nii') +
    glob.glob('/content/lits/volume_pt4/*.nii') +
    glob.glob('/content/lits/volume_pt5/*.nii')
)
print(f"Volumes found: {len(volumes)}")

from google.colab import drive
drive.mount('/content/drive')

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using: {device}")

model = UNet(
    spatial_dims=3,
    in_channels=1,
    out_channels=2,
    channels=(16, 32, 64, 128, 256),
    strides=(2, 2, 2, 2),
    num_res_units=2,
    norm=Norm.BATCH,
).to(device)

# Load your saved model from Drive
model.load_state_dict(
    torch.load("/content/drive/MyDrive/best_unet_model.pth",
               map_location=device)
)
print("✅ Saved model loaded — resuming from Epoch 15!")

loss_fn   = DiceCELoss(sigmoid=True, to_onehot_y=True)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='min', factor=0.5, patience=10
)

# Resume training — 85 epochs remaining
max_epochs   = 85
best_loss    = 0.7439
loss_history = []
val_history  = []

print(f"🚀 Resuming from Epoch 15 — {max_epochs} epochs remaining...\n")

for epoch in range(max_epochs):
    model.train()
    epoch_loss = 0.0
    steps      = 0

    for batch in train_loader:
        inputs = batch["image"].to(device)
        labels = batch["label"].to(device)

        optimizer.zero_grad()
        with torch.amp.autocast('cuda'):
            outputs = model(inputs)
            loss    = loss_fn(outputs, labels)
        loss.backward()
        optimizer.step()

        epoch_loss += loss.item()
        steps      += 1

    epoch_loss /= steps
    loss_history.append(epoch_loss)

    if (epoch + 1) % 5 == 0:
        print(f"Epoch [{epoch+16:3d}/100]  Train Loss: {epoch_loss:.4f}")

    if (epoch + 1) % 10 == 0:
        model.eval()
        val_loss  = 0.0
        val_steps = 0

        with torch.no_grad():
            for val_batch in val_loader:
                val_inputs = val_batch["image"].to(device)
                val_labels = val_batch["label"].to(device)
                with torch.amp.autocast('cuda'):
                    val_outputs = model(val_inputs)
                    v_loss      = loss_fn(val_outputs, val_labels)
                val_loss  += v_loss.item()
                val_steps += 1

        val_loss /= val_steps
        val_history.append(val_loss)
        scheduler.step(val_loss)

        print(f"          ↳ Val Loss: {val_loss:.4f}")

        if val_loss < best_loss:
            best_loss = val_loss
            torch.save(model.state_dict(),
                       "/content/drive/MyDrive/best_unet_model.pth")
            print("          ⭐ New best model saved to Drive!")

# Plot
plt.figure(figsize=(10, 4))
plt.plot(loss_history, label='Train Loss',
         color='steelblue', linewidth=1.5)
plt.plot([i*10-1 for i in range(1, len(val_history)+1)],
         val_history, label='Val Loss',
         color='orange', marker='o', linewidth=1.5)
plt.xlabel("Epoch")
plt.ylabel("DiceCE Loss")
plt.title("UNet — Resumed Training Loss")
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("/content/drive/MyDrive/unet_loss_curve.png", dpi=150)
plt.show()

print(f"\n✨ Training complete!")
print(f"   Best validation loss: {best_loss:.4f}")
print(f"   Model saved to Drive ✅")

from google.colab import drive
drive.mount('/content/drive', force_remount=True)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using: {device}")

model = UNet(
    spatial_dims=3,
    in_channels=1,
    out_channels=2,
    channels=(16, 32, 64, 128, 256),
    strides=(2, 2, 2, 2),
    num_res_units=2,
    norm=Norm.BATCH,
).to(device)

model.load_state_dict(
    torch.load("/content/drive/MyDrive/best_unet_model.pth",
               map_location=device)
)
print("✅ Model loaded — resuming from Epoch 30!")

loss_fn   = DiceCELoss(sigmoid=True, to_onehot_y=True)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='min', factor=0.5, patience=10
)

max_epochs   = 70       # ← 100 - 30 = 70 remaining
best_loss    = 0.6377   # ← best val loss so far
loss_history = []
val_history  = []

print(f"🚀 Resuming from Epoch 30 — {max_epochs} epochs remaining...\n")

for epoch in range(max_epochs):
    model.train()
    epoch_loss = 0.0
    steps      = 0

    for batch in train_loader:
        inputs = batch["image"].to(device)
        labels = batch["label"].to(device)

        optimizer.zero_grad()
        with torch.amp.autocast('cuda'):
            outputs = model(inputs)
            loss    = loss_fn(outputs, labels)
        loss.backward()
        optimizer.step()

        epoch_loss += loss.item()
        steps      += 1

    epoch_loss /= steps
    loss_history.append(epoch_loss)

    if (epoch + 1) % 5 == 0:
        print(f"Epoch [{epoch+31:3d}/100]  Train Loss: {epoch_loss:.4f}")

    if (epoch + 1) % 10 == 0:
        model.eval()
        val_loss  = 0.0
        val_steps = 0

        with torch.no_grad():
            for val_batch in val_loader:
                val_inputs = val_batch["image"].to(device)
                val_labels = val_batch["label"].to(device)
                with torch.amp.autocast('cuda'):
                    val_outputs = model(val_inputs)
                    v_loss      = loss_fn(val_outputs, val_labels)
                val_loss  += v_loss.item()
                val_steps += 1

        val_loss /= val_steps
        val_history.append(val_loss)
        scheduler.step(val_loss)

        print(f"          ↳ Val Loss: {val_loss:.4f}")

        if val_loss < best_loss:
            best_loss = val_loss
            torch.save(model.state_dict(),
                       "/content/drive/MyDrive/best_unet_model.pth")
            print("          ⭐ New best model saved to Drive!")

# Plot
plt.figure(figsize=(10, 4))
plt.plot(loss_history, label='Train Loss',
         color='steelblue', linewidth=1.5)
plt.plot([i*10-1 for i in range(1, len(val_history)+1)],
         val_history, label='Val Loss',
         color='orange', marker='o', linewidth=1.5)
plt.xlabel("Epoch")
plt.ylabel("DiceCE Loss")
plt.title("UNet — Final Training Loss")
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("/content/drive/MyDrive/unet_loss_curve_final.png", dpi=150)
plt.show()

print(f"\n✨ Training complete!")
print(f"   Best validation loss: {best_loss:.4f}")
print(f"   Model saved to Drive ✅")

os.system(f"""pip install -q monai nibabel""")

import torch
import numpy as np
from PIL import Image
import os, glob
from monai.networks.nets import UNet
from monai.networks.layers import Norm
from monai.transforms import (
    Compose, LoadImaged, EnsureChannelFirstd,
    Orientationd, Spacingd, ScaleIntensityRanged, Lambdad
)
from google.colab import drive
drive.mount('/content/drive')

print("✅ Imports done!")

device = torch.device("cpu")
print(f"Using: {device}")

model = UNet(
    spatial_dims=3,
    in_channels=1,
    out_channels=2,
    channels=(16, 32, 64, 128, 256),
    strides=(2, 2, 2, 2),
    num_res_units=2,
    norm=Norm.BATCH,
).to(device)

model.load_state_dict(
    torch.load("/content/drive/MyDrive/best_unet_model.pth",
               map_location=device)
)
model.eval()
print("✅ Saved UNet model loaded from Drive!")

from monai.transforms import ResizeWithPadOrCropd
import torch.nn.functional as F

# Pipeline for full volume loading
extract_pipeline = Compose([
    LoadImaged(keys=["image", "label"]),
    EnsureChannelFirstd(keys=["image", "label"]),
    Orientationd(keys=["image", "label"], axcodes="RAS"),
    Spacingd(keys=["image", "label"],
             pixdim=(1.5, 1.5, 2.0),
             mode=("bilinear", "nearest")),
    ScaleIntensityRanged(keys=["image"],
                         a_min=-175, a_max=250,
                         b_min=0.0, b_max=1.0, clip=True),
    Lambdad(keys=["label"],
            func=lambda x: (x > 0).astype(float)),
])

save_dir = "/content/drive/MyDrive/extracted_slices"
os.makedirs(save_dir, exist_ok=True)

print(f"🔍 Extracting best tumor slices from {len(data_list)} scans...\n")

saved_count   = 0
skipped_count = 0

for i, pair in enumerate(data_list):
    try:
        # Load and preprocess full volume
        sample    = extract_pipeline(pair)
        image_vol = sample["image"][0].numpy()  # shape: H x W x D
        label_vol = sample["label"][0].numpy()  # shape: H x W x D

        # Find slice with largest tumor area
        tumor_areas = [label_vol[:, :, z].sum()
                       for z in range(label_vol.shape[2])]
        best_z      = int(np.argmax(tumor_areas))

        # Skip if no tumor found
        if tumor_areas[best_z] == 0:
            print(f"  ⚠️  Sample {i:2d}: No tumor found — skipping")
            skipped_count += 1
            continue

        # Extract 2D slice
        ct_slice  = image_vol[:, :, best_z]

        # Convert to 224x224 RGB PNG
        img_uint8 = (ct_slice * 255).astype(np.uint8)
        img_pil   = Image.fromarray(img_uint8).convert("RGB")
        img_pil   = img_pil.resize((224, 224))

        # Save to Drive
        save_path = os.path.join(
            save_dir, f"sample_{i:03d}_slice{best_z}.png")
        img_pil.save(save_path)

        saved_count += 1
        print(f"  ✅ Sample {i:2d} → best slice z={best_z:3d} → saved")

    except Exception as e:
        print(f"  ❌ Sample {i:2d}: Error — {e}")
        skipped_count += 1

print(f"\n🎉 Extraction complete!")
print(f"   Saved:   {saved_count} slices")
print(f"   Skipped: {skipped_count} scans")
print(f"   Location: {save_dir}")

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import glob, os

# Load pretrained ResNet-50
resnet = models.resnet50(pretrained=True)
resnet_extractor = nn.Sequential(*list(resnet.children())[:-1])
resnet_extractor.eval()

# Transform
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

slice_paths     = sorted(glob.glob(
    '/content/drive/MyDrive/extracted_slices/*.png'))
resnet_features = []

print(f"Extracting ResNet-50 features from {len(slice_paths)} slices...")

for i, path in enumerate(slice_paths):
    img    = Image.open(path).convert('RGB')
    tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        feat = resnet_extractor(tensor).squeeze().numpy()
    resnet_features.append(feat)
    print(f"  {i+1}/{len(slice_paths)} done", end='\r')

resnet_features = np.array(resnet_features)
np.save('/content/drive/MyDrive/resnet_features.npy', resnet_features)

print(f"\n✅ ResNet-50 features shape: {resnet_features.shape}")
print(f"✅ Saved to Drive!")
# Expected: (30, 2048)

# Load pretrained DenseNet-121
densenet = models.densenet121(pretrained=True)
densenet_extractor = nn.Sequential(
    densenet.features,
    nn.AdaptiveAvgPool2d((1, 1))
)
densenet_extractor.eval()

densenet_features = []

print(f"Extracting DenseNet-121 features from {len(slice_paths)} slices...")

for i, path in enumerate(slice_paths):
    img    = Image.open(path).convert('RGB')
    tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        feat = densenet_extractor(tensor).squeeze().numpy()
    densenet_features.append(feat)
    print(f"  {i+1}/{len(slice_paths)} done", end='\r')

densenet_features = np.array(densenet_features)
np.save('/content/drive/MyDrive/densenet_features.npy', densenet_features)

print(f"\n✅ DenseNet-121 features shape: {densenet_features.shape}")
print(f"✅ Saved to Drive!")
# Expected: (30, 1024)

import glob
volumes = sorted(glob.glob('/content/lits/volumes/*.nii'))
print(f"Volumes: {len(volumes)}")

from google.colab import drive
drive.mount('/content/drive')
import numpy as np
import nibabel as nib
import pandas as pd

print("Extracting fast radiomic features...")

def extract_fast_radiomics(vol_path, seg_path):
    vol          = nib.load(vol_path).get_fdata()
    seg          = nib.load(seg_path).get_fdata()
    tumor_mask   = seg > 0
    tumor_voxels = vol[tumor_mask]

    if len(tumor_voxels) == 0:
        return None

    features = {}
    features['mean']     = float(np.mean(tumor_voxels))
    features['std']      = float(np.std(tumor_voxels))
    features['min']      = float(np.min(tumor_voxels))
    features['max']      = float(np.max(tumor_voxels))
    features['median']   = float(np.median(tumor_voxels))
    features['p10']      = float(np.percentile(tumor_voxels, 10))
    features['p90']      = float(np.percentile(tumor_voxels, 90))
    features['iqr']      = float(np.percentile(tumor_voxels, 75) -
                                  np.percentile(tumor_voxels, 25))
    features['skewness'] = float(np.mean(
        ((tumor_voxels - np.mean(tumor_voxels)) /
         (np.std(tumor_voxels) + 1e-6))**3))
    features['kurtosis'] = float(np.mean(
        ((tumor_voxels - np.mean(tumor_voxels)) /
         (np.std(tumor_voxels) + 1e-6))**4))
    features['energy']   = float(
        np.sum(tumor_voxels**2) / len(tumor_voxels))
    features['volume']   = float(tumor_mask.sum())
    features['range']    = float(features['max'] - features['min'])

    # Best slice texture
    tumor_areas = seg.sum(axis=(0, 1))
    best_z      = int(np.argmax(tumor_areas))
    slice_2d    = vol[:, :, best_z]
    mask_2d     = seg[:, :, best_z] > 0

    if mask_2d.sum() > 0:
        region = slice_2d[mask_2d]
        features['slice_mean']     = float(np.mean(region))
        features['slice_std']      = float(np.std(region))
        features['slice_contrast'] = float(np.var(region))
        features['slice_energy']   = float(
            np.sum(region**2) / len(region))
        features['slice_entropy']  = float(
            -np.sum(
                np.histogram(region, bins=32, density=True)[0] *
                np.log2(
                    np.histogram(region, bins=32,
                                 density=True)[0] + 1e-6)))
    else:
        for k in ['slice_mean', 'slice_std', 'slice_contrast',
                  'slice_energy', 'slice_entropy']:
            features[k] = 0.0

    return features

radiomic_features = []
print(f"Processing {len(data_list)} scans...\n")

for i, pair in enumerate(data_list):
    try:
        feats = extract_fast_radiomics(pair['image'], pair['label'])
        if feats:
            radiomic_features.append(feats)
            print(f"  ✅ {i+1:2d}/{len(data_list)}", end='\r')
    except Exception as e:
        print(f"\n  ❌ Sample {i+1}: {e}")

radio_df = pd.DataFrame(radiomic_features)
radio_df.to_csv('/content/drive/MyDrive/radiomic_features.csv',
                index=False)
radio_X  = radio_df.values

print(f"\n✅ Radiomic features shape: {radio_X.shape}")
print(f"✅ Saved to Drive!")

from google.colab import drive
drive.mount('/content/drive')
import numpy as np
import nibabel as nib
import pandas as pd
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import glob, os

# Check slices are in Drive
slice_paths = sorted(glob.glob(
    '/content/drive/MyDrive/extracted_slices/*.png'))
print(f"Slices found in Drive: {len(slice_paths)}")

# Transform
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# --- ResNet-50 ---
print("\nExtracting ResNet-50 features...")
resnet           = models.resnet50(pretrained=True)
resnet_extractor = nn.Sequential(*list(resnet.children())[:-1])
resnet_extractor.eval()

resnet_features = []
for i, path in enumerate(slice_paths):
    img    = Image.open(path).convert('RGB')
    tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        feat = resnet_extractor(tensor).squeeze().numpy()
    resnet_features.append(feat)
    print(f"  {i+1}/{len(slice_paths)}", end='\r')

resnet_X = np.array(resnet_features)
np.save('/content/drive/MyDrive/resnet_features.npy', resnet_X)
print(f"\n✅ ResNet-50 shape: {resnet_X.shape}")

# --- DenseNet-121 ---
print("\nExtracting DenseNet-121 features...")
densenet           = models.densenet121(pretrained=True)
densenet_extractor = nn.Sequential(
    densenet.features,
    nn.AdaptiveAvgPool2d((1, 1))
)
densenet_extractor.eval()

densenet_features = []
for i, path in enumerate(slice_paths):
    img    = Image.open(path).convert('RGB')
    tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        feat = densenet_extractor(tensor).squeeze().numpy()
    densenet_features.append(feat)
    print(f"  {i+1}/{len(slice_paths)}", end='\r')

densenet_X = np.array(densenet_features)
np.save('/content/drive/MyDrive/densenet_features.npy', densenet_X)
print(f"\n✅ DenseNet-121 shape: {densenet_X.shape}")
print("\n✅ Both feature files saved to Drive!")

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import pandas as pd

# Load all features
resnet_X   = np.load('/content/drive/MyDrive/resnet_features.npy')
densenet_X = np.load('/content/drive/MyDrive/densenet_features.npy')
radio_X    = pd.read_csv(
    '/content/drive/MyDrive/radiomic_features.csv').values

print(f"ResNet-50   shape: {resnet_X.shape}")
print(f"DenseNet    shape: {densenet_X.shape}")
print(f"Radiomics   shape: {radio_X.shape}")

# ⚠️ Replace with real labels when available
y = np.random.randint(0, 2, len(resnet_X))

print("\n📊 Comparing all 3 models...\n")

results = {}
for name, X in [('ResNet-50',    resnet_X),
                ('DenseNet-121', densenet_X),
                ('Radiomics',    radio_X)]:
    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    clf      = LogisticRegression(max_iter=1000)
    skf      = StratifiedKFold(n_splits=5,
                               shuffle=True, random_state=42)
    aucs     = cross_val_score(clf, X_scaled, y,
                               cv=skf, scoring='roc_auc')
    results[name] = round(aucs.mean(), 3)
    print(f"  {name:15s}  AUC: {aucs.mean():.3f} ± {aucs.std():.3f}")

# Bar chart
plt.figure(figsize=(8, 5))
bars = plt.bar(results.keys(), results.values(),
               color=['#2196F3', '#4CAF50', '#FF9800'],
               width=0.5, edgecolor='white')

for bar, val in zip(bars, results.values()):
    plt.text(bar.get_x() + bar.get_width()/2,
             bar.get_height() + 0.01,
             str(val), ha='center',
             va='bottom', fontsize=12)

plt.ylim(0.4, 1.0)
plt.ylabel('ROC-AUC Score', fontsize=12)
plt.title('Feature Extraction Model Comparison', fontsize=14)
plt.grid(True, alpha=0.3, axis='y')
plt.tight_layout()
plt.savefig('/content/drive/MyDrive/model_comparison.png', dpi=150)
plt.show()

best_model = max(results, key=results.get)
print(f"\n🏆 Best model: {best_model} (AUC: {results[best_model]})")
print(f"✅ Chart saved to Drive!")

import matplotlib.pyplot as plt
import numpy as np
from google.colab import drive
drive.mount('/content/drive')

# Your actual recorded loss values from training
# Fill these in from your training output

train_losses = [
    0.8728,  # Epoch 5
    0.7807,  # Epoch 10
    0.7305,  # Epoch 15
    0.7133,  # Epoch 20
    0.6475,  # Epoch 25
    0.5923,  # Epoch 30
    0.5851,  # Epoch 35
    0.5471,  # Epoch 40
]

val_losses = [
    0.7439,  # Epoch 10
    0.6377,  # Epoch 25
    0.5577,  # Epoch 40
]

train_epochs = [5, 10, 15, 20, 25, 30, 35, 40]
val_epochs   = [10, 25, 40]

# --- Plot ---
plt.figure(figsize=(10, 5))

# Training loss line
plt.plot(train_epochs, train_losses,
         color='steelblue',
         linewidth=2,
         marker='o',
         markersize=6,
         label='Training Loss')

# Validation loss line
plt.plot(val_epochs, val_losses,
         color='orange',
         linewidth=2,
         marker='s',
         markersize=8,
         label='Validation Loss')

# Add value labels on each point
for x, y in zip(train_epochs, train_losses):
    plt.annotate(f'{y:.4f}',
                 xy=(x, y),
                 xytext=(0, 10),
                 textcoords='offset points',
                 ha='center',
                 fontsize=8,
                 color='steelblue')

for x, y in zip(val_epochs, val_losses):
    plt.annotate(f'{y:.4f}',
                 xy=(x, y),
                 xytext=(0, -15),
                 textcoords='offset points',
                 ha='center',
                 fontsize=8,
                 color='orange')

# Mark best model point
plt.axvline(x=40, color='red',
            linestyle='--', alpha=0.5,
            label='Best Model (Epoch 40)')

plt.xlabel('Epoch', fontsize=12)
plt.ylabel('DiceCE Loss', fontsize=12)
plt.title('UNet Training & Validation Loss\n(Liver Tumor Segmentation)',
          fontsize=14)
plt.legend(fontsize=11)
plt.grid(True, alpha=0.3)
plt.xticks(train_epochs)
plt.tight_layout()

# Save to Drive
plt.savefig('/content/drive/MyDrive/unet_loss_curve_final.png',
            dpi=150, bbox_inches='tight')
plt.show()

print("✅ Loss curve saved to Drive!")
print(f"\nSummary:")
print(f"  Starting Train Loss: {train_losses[0]:.4f}")
print(f"  Final Train Loss:    {train_losses[-1]:.4f}")
print(f"  Best Val Loss:       {min(val_losses):.4f} (Epoch 40)")
print(f"  Total improvement:   {train_losses[0]-train_losses[-1]:.4f}")