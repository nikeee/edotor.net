declare module "viz.js";
declare module "viz.js/full.render.js";
declare module "react-svg-pan-zoom";
declare module "*.gv" {
	const content: string;
	export default content;
}
declare module "react-spinners/BarLoader" {
	import { BarLoader } from "react-spinners";
	export default BarLoader;
}
