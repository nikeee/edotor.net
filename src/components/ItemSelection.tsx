import { useState } from "react";

type TItem = string;

interface Props {
	defaultItem: TItem | undefined;
	possibleItems: TItem[];
	onChangeItem(item: TItem): void;

	label: string;
	selectionClassName?: string;
}

export default function ItemSelection({
	defaultItem,
	possibleItems,
	onChangeItem,
	label,
	selectionClassName,
}: Props) {
	const [currentSelection, setCurrentSelection] = useState<TItem | undefined>(
		defaultItem,
	);

	const handleChange = (newItem: TItem) => {
		if (currentSelection === undefined || newItem !== currentSelection) {
			onChangeItem(newItem);
			setCurrentSelection(newItem);
		}
	};

	import.meta.env.DEV && console.assert(!!label);

	return (
		<li className="nav-item dropdown">
			<span
				className="nav-link dropdown-toggle"
				data-bs-toggle="dropdown"
				aria-haspopup="true"
			>
				{label}{" "}
				<span className={selectionClassName}>{currentSelection || ""}</span>
			</span>
			<div className="dropdown-menu">
				{possibleItems.map(e => (
					<button
						className="dropdown-item"
						key={e}
						onClick={() => handleChange(e)}
						type="button"
					>
						{e}
					</button>
				))}
			</div>
		</li>
	);
}
