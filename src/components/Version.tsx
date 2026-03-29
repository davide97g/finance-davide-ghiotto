import packageJson from "../../package.json";

export default function Version() {
	return (
		<p className="text-[10px] text-muted-foreground tracking-wider">
			v{packageJson.version}
		</p>
	);
}
