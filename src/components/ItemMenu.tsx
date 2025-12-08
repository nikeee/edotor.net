export interface ItemMenuItem<T> {
	value: T;
	display: string;
}

interface Props<T> {
	items: readonly ItemMenuItem<T>[];
	onClickItem(item: ItemMenuItem<T>["value"]): void;
	label: string;
}
export default function ItemMenu<TItem>(props: Props<TItem>) {
	const options = props.items.map(item => (
		<button
			type="button"
			className="dropdown-item"
			key={item.display}
			onClick={() => props.onClickItem(item.value)}
		>
			{item.display}
		</button>
	));

	return (
		<li className="nav-item dropdown">
			<button
				type="button"
				className="nav-link dropdown-toggle"
				data-bs-toggle="dropdown"
				aria-haspopup="true"
			>
				{props.label}
			</button>
			<div className="dropdown-menu">{options}</div>
		</li>
	);
}
