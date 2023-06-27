- switch out trystero for plain WT?
- add altlogo

- react-virtualized for infinite scrolling
  - message auto-delete
- New font
  - new accent colors
- list of prior rooms in init page
- more icons in button: https://pictogrammers.com/library/mdi/
- reclaim name w/ signing challenge
- accounts system
    - firebase for trystero https://github.com/dmotz/trystero#firebase-setup

https://www.radix-ui.com/docs/

https://github.com/pmndrs/zustand/tree/main#transient-updates-for-often-occurring-state-changes

filegen:
 dd if=/dev/urandom of=temp_10G_file bs=1 count=0 seek=10G

 - switch to native-file-system-adapter at some point when the api becomes more stable
 - When million is ready, perhaps switch to it https://million.dev/docs/quickstart

- decisions decisions, how do I handle large files
  - chunking 
    - pre abstraction
    - post abstraction
  - rtc call
  - to investigate
    - O good, but may need more tests https://github.com/julienc91/ezshare

https://joji.me/en-us/blog/processing-huge-files-using-filereader-readasarraybuffer-in-web-browser/