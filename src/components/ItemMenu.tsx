export interface ItemMenuItem<T> {
	value: T;
	display: string;
}

interface Props<T> {
	items: readonly ItemMenuItem<T>[];
	onClickItem(item: ItemMenuItem<T>["value"]): void;
	label: string;
}
export function ItemMenu<TItem>(props: Props<TItem>) {
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
			<a
				className="nav-link dropdown-toggle"
				href="#"
				data-toggle="dropdown"
				aria-haspopup="true"
				aria-expanded="false"
			>
				{props.label}
			</a>
			<div className="dropdown-menu">{options}</div>
		</li>
	);
}
