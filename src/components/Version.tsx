import packageJson from "../../package.json";

export default function Version() {
	return (
		<p className="text-[10px] text-stone-400 tracking-wider">
			v{packageJson.version}
		</p>
	);
}
