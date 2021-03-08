# LittleDuck 2020 Language

![LittleDuck](/assets/LittleDuck.png)

## How to use

Clone the project, then run

```bash
npm install
```

After that, to run the parser againts test files, run

```bash
npm run start (or npm start)
```

### Adding more tests

To run more tests simply add text files under the `src/test/` dir. The script will automatically run the parser against every file inside that dir.

## Development

To run the project while developing use

```bash
npm run dev
```

This will run the script using nodemon and will listen to any file change inside `src/` with the extensions `json,ts,txt,ohm`
