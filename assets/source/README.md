# Image sources

`social-preview.html` is the source for `../social-preview.png` (1280×640, used as the GitHub social preview and the Open Graph / Twitter card image).

To regenerate after editing:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1280,640 \
  --screenshot=assets/social-preview.png "file://$PWD/assets/source/social-preview.html"
```

All icons are original line drawings; no third-party logos or brand marks are used.
