# albu
A semi-static mobile photo gallery hosted on Tencent COS & Serverless.

## Highlights

 + Nearly cost-free. **albu** is hosted on Tencent COS (as a static server for photos and web pages) and Serverless (as an authentication backend), saving a lot of money compared with traditional sites on VPS.
 + Diary-like timeline. Photos are organized and sorted by their creation time. Short sentences (**Remarks**) or phrases (**Milestones**) can be inserted between photos in memory of certain events or anniversaries.
 + Powerful access control. Photos, Remarks and Milestones might be public (viewed by anyone) or private (guarded by authentication).
 + Customized sharing. Instead of showing a full list of public photos, one can generate customized links to exhibit photos (Remarks and Milestones) falling in certain time periods.
 + Highly optimized. 
   + Pre-compress all photos to reduce bandwidth usage; 
   + Render visible items only to reduce memory usage;
   + Chunkize Chiniese fonts according to frequency of characters, in order to reduce loading time of fonts.
 + Wechat sharing support. **albu** can be configured to support wechat sharing.


## Overview of the Directories

Like other static site generators, **albu** does most of the heavy work (photo compression, building web pages, etc.) locally, and then deploys generated contents onto cloud services.

`tools/` contains some scripts to simplify workflow like selecting / compressing photos, uploading assets, chunkizing fonts etc.

`web/` contains the source code of web pages. **albu** uses Vue.js as front-end framework.

`auth/` contains the source code of an authentication backend, which runs on Tencent Serverless. The backend checks password (unlock gesture) sent from frontend, and responds with a token for authenticated user. The token is used for accessing private contents on COS. The backend also generates a signature which is required by Wechat JS SDK.

`assets/source/` contains the source photos that you would like to exhibit in the gallery. 

`assets/_generated/` contains the generated static assets that would be uploaded to COS. It is **NOT** recommended to edit any files under this directory manually.

## Quick Start

Assume that you have opened COS and Serveless services on Tencent Cloud.

### Configuration

Copy `config.example.json` to `config.json` in the root directory, and fill the blanks following the instructions below:

 + `tcloud` section contains the infomation of your Tencent cloud account.
 + `cos` section contains the meta infomation of your created COS bucket.
 + `secret` is the secret key for encrytion. You can use any random string here.
 + `passwords` contains user-defined unlock gestures for accessing private contents. The elements in it should be strings of `0...8`, representing the consecutive path of the gestures. Each circle is encoded as:
   ```
   0 1 2
   3 4 5
   6 7 8
   ```
 + `web` contains some meta infomation of web pages:
   + `web.authURL` is the URL of deployed auth backend. This should be filled later.
   + `web.title` is the document title of web pages.
 + `wx` section (optional) contains the infomation of your Wechat developer account. This is used by Wechat sharing functions.

After done, simply run `python3 setup.py` to dispatch configuration into sub-directories.

### Install Dependencies

You should have both `Node.js >= 10` and `Python >= 3.6` installed.

Run the following command to install global dependencies:

```bash
[sudo] python3 -m pip install -r requirements.txt
[sudo] npm install -g serverless
```

### Prepare & Upload Photos

Source photos are stored under `assets/source/`. You can either copy your photos or make symbol links into the directory.

**albu** provides a simple photo selector to allow you conveniently select a subset from a long list of photos. Simply run `tools/selector.py --src <glob>`, where `<glob>` is a glob expression like `Photos/*.jpg`. In the pop-up window, you can press <kbd>A</kbd>/<kbd>D</kbd> to navigate forward / backward, and <kbd>Space</kbd>/<kbd>X</kbd> to select / deselect a photo.

After the source prepared, run `tools/proc.py` to pre-process the photos. The photos would be compressed and meta data would be generated for exhibiting. The generated assets are stored under `assets/_generated/`.

With these steps done, the assets are ready to be deployed. Simply run `tools/sync.py` to synchronize local and remote assets.

If photos are added or deleted in the future, just repeat the above pre-processing and synchronizing steps to finish deployment. **albu** transfers only modified assets between local and the cloud.

### Deploy Authentication Backend

Simply run the following commands for deployment:

```bash
cd auth/
serverless deploy
```

After done, the console will print out a URL like `https://service-xxxxxxxx-1254463987.gz.apigw.tencentcs.com/release/`, which is the link to the backend. Please fill `authURL` in `config.json` with this URL.

### Deploy Web Pages

Simply run the folowing commands:

```bash
cd web/
npm install
npm run deploy
```

**albu** allows you to customize the Chinese font of Remarks and Milestones. Simply place your font under `web/src/fonts/` and rename to `custom.ttf`. Run `tools/makefont.py` to chunkize the font and generate corresponding SCSS code.