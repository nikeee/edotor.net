import { PureComponent } from "react";

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

export class ItemSelection extends PureComponent<Props, State> {
	constructor(p: Props) {
		super(p);

		this.state = {
			currentSelection: p.defaultItem,
		};
	}

	#handleChange(newItem: TItem) {
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

	#getDropDown() {
		const options = this.props.possibleItems.map(e => (
			<button
				className="dropdown-item"
				key={e}
				onClick={() => this.#handleChange(e)}
				type="button"
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

	#getShowSelectionLabel() {
		const p = this.props;
		const s = this.state;

		import.meta.env.DEV && console.assert(!!p.label);

		const text = s.currentSelection ? s.currentSelection : "";

		return (
			<span
				className="nav-link dropdown-toggle"
				data-toggle="dropdown"
				aria-haspopup="true"
			>
				{p.label} <span className={p.selectionClassName}>{text}</span>
			</span>
		);
	}

	render() {
		return (
			<li className="nav-item dropdown">
				{this.#getShowSelectionLabel()}
				{this.#getDropDown()}
			</li>
		);
	}
}
