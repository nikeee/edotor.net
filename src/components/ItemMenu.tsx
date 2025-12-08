export interface ItemMenuItem<T> {
	value: T;
	display: string;
}

export interface ItemMenuProps<T> {
	items: readonly ItemMenuItem<T>[];
	onClickItem(item: ItemMenuItem<T>["value"]): void;
	label: string;
}
export default function ItemMenu<TItem>(props: ItemMenuProps<TItem>) {
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
			<div className="dropdown-menu">
				{props.items.map(item => (
					<button
						type="button"
						className="dropdown-item"
						key={item.display}
						onClick={() => props.onClickItem(item.value)}
					>
						{item.display}
					</button>
				))}
			</div>
		</li>
	);
}
