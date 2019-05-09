import * as React from "react";

type TItem = string;

interface Props {
	items: TItem[];
	onClickItem(item: TItem): void;
	label: string;
}
export const ItemMenu = (props: Props) => {

	const options = props.items.map(e => (
		<button
			className="dropdown-item"
			key={e}
			onClick={() => props.onClickItem(e)}
		>
			{e}
		</button>
	));

	return (
		<li className="nav-item dropdown">
			<a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
				{props.label}
			</a>
			<div className="dropdown-menu">
				{options}
			</div>
		</li>
	);
};
