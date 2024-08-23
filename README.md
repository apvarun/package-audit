# Package Audit with WebContainers

This is a simple web application that uses the [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) command to scan your package.json for vulnerabilities.

It uses the [WebContainers](https://github.com/microsoft/WebContainers) project to run the npm audit command in a secure and isolated environment, ensuring that the audit results are accurate and reliable.

## Running the Application

To run the application, you need to have Node.js and npm installed on your system.

1. Clone the repository:

```bash
git clone https://github.com/apvarun/package-audit.git
cd package-audit
```

2. Install the dependencies:

```bash
pnpm install
```

3. Run the application:

```bash
pnpm run dev
```

4. Open your browser and navigate to `http://localhost:5173`.

## Contributing

Contributions are welcome! If you find a bug or have a suggestion, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
