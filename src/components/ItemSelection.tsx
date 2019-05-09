import * as React from "react";

type TItem = string;

interface Props {
	defaultItem: TItem | undefined;
	possibleItems: TItem[];
	onChangeItem(item: TItem): void;

	label: string;
	selectionClassName?: string;
}

interface State {
	currentSelection: TItem | undefined;
}

export class ItemSelection extends React.PureComponent<Props, State> {

	constructor(p: Props) {
		super(p);

		this.state = {
			currentSelection: p.defaultItem,
		};
	}

	private handleChange(newItem: TItem) {
		this.setState(prevState => {
			const oldItem = prevState.currentSelection;
			if (oldItem === undefined || newItem !== oldItem) {
				if (this.props.onChangeItem) {
					this.props.onChangeItem(newItem);
				}
				return {
					currentSelection: newItem,
				};
			}
			return prevState;
		});
	}

	private getDropDown() {
		const options = this.props.possibleItems.map(e => (
			<button
				className="dropdown-item"
				key={e}
				onClick={() => this.handleChange(e)}
			>
				{e}
			</button>
		));

		return (
			<div className="dropdown-menu" id="supported-engines-list">
				{options}
			</div>
		);
	}

	private getShowSelectionLabel() {
		const p = this.props;
		const s = this.state;

		DEV && console.assert(!!p.label);

		const text = s.currentSelection ? s.currentSelection : "";

		return (
			<a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
				{p.label} <span className={p.selectionClassName}>{text}</span>
			</a>
		);
	}

	render() {
		return (
			<li className="nav-item dropdown">
				{this.getShowSelectionLabel()}
				{this.getDropDown()}
			</li>
		);
	}
}
