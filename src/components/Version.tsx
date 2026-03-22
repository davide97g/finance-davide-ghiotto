import packageJson from '../../package.json';

export default function Version() {
	return <p className="text-[10px]">v{packageJson.version}</p>;
}
