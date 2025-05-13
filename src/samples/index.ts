import Tutorial from "./tutorial.gv?raw";
import StatemMachine from "./state-machine.gv?raw";
import Clustering0 from "./clustering-0.gv?raw";
import Clustering1 from "./clustering-1.gv?raw";
import HuffmanTree from "./huffman-tree.gv?raw";
import HammingDistance from "./hamming-distance.gv?raw";
import AttributeDemo from "./attribute-distance.gv?raw";
import Contact from "./contact.gv?raw";
import Empty from "./empty-graph.gv?raw";

import type { ItemMenuItem } from "../components/ItemMenu";

export const samples: readonly ItemMenuItem<string>[] = [
	{ display: "State Machine", value: StatemMachine },
	{ display: "Clustering", value: Clustering0 },
	{ display: "Clustering 2", value: Clustering1 },
	{ display: "Huffman Tree", value: HuffmanTree },
	{ display: "Hamming Distance", value: HammingDistance },
	{ display: "Attribute Demo", value: AttributeDemo },
	{ display: "Contact", value: Contact },
	{ display: "Tutorial", value: Tutorial },
	{ display: "Empty Graph", value: Empty },
];

export { Tutorial as tutorial };
