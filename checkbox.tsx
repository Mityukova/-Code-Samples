import React from 'react';
import { CustomComponentsContext } from '../../components';
import PrintDisabledIcon from '@material-ui/icons/PrintDisabled';
import PrintIcon from '@material-ui/icons/Print';
import FontDownloadIcon from '@material-ui/icons/FontDownload';
import Context from 'common/hocs/WithNavigation/WithNavigation';
type Props = {
  id: Number;
  label: String | typeof undefined;
  doPrint: Boolean | typeof undefined;
  doPrintIfFilled: Boolean | typeof undefined;
  setComponentToConfigure: Function;
  componentType: 'string';
  context: object;
  saveCustomComponentValue: Function;
  requiredComponent: String;
  filledValue: 'string';
};

const CustomCheckbox: React.FunctionComponent<Props> = props => {
  const { id, setComponentToConfigure, componentType } = props;
  const viewMode = !!props.context;
  const clickHandler = () => {
    if (typeof props.context === 'undefined') {
      setComponentToConfigure(id, componentType);
    }
  };

  const [selectedValues, setSelectedValues] = React.useState(props.filledValue ? props.filledValue : '');

  const context = viewMode ? props.context : React.useContext(CustomComponentsContext);

  React.useEffect(() => {
    viewMode && props.saveCustomComponentValue(id, selectedValues, props.requiredComponent === 'true', true);
  }, []);

  const handleChange = () => {
    // @ts-ignore
    const tmp = Array.from(document.querySelectorAll(`#customComponent${id} .customInputOfCheckbox:checked`))
      .map((item: any) => item.value)
      .join(', ');
    setSelectedValues(tmp);
    console.log(tmp);
    viewMode && props.saveCustomComponentValue(id, tmp, props.requiredComponent === 'true', true);
  };

  return (
    <div
      data-props={encodeURIComponent(JSON.stringify(props))}
      data-context={encodeURIComponent(JSON.stringify(context))}
      onClick={clickHandler}
      id={`customComponent${id}`}
      className={'customComponent'}
    >
      <div>
        <label
          htmlFor={`checkbox${id}`}
          className={context.requiredComponent === 'true' ? 'required' : ''}
          style={context.boldLabel === 'true' ? { fontWeight: 'bold' } : {}}
        >
          {context.label}
        </label>
        {context.selectValues.map((item, index) => {
          const randId = Math.random();
          return (
            <div key={index} style={{ display: 'inline-block', marginLeft: '5px' }}>
              <input
                style={{ cursor: 'pointer' }}
                className={'customInputOfCheckbox'}
                type="checkbox"
                id={`checkbox${randId}`}
                onChange={handleChange}
                value={item.name}
              />
              <label htmlFor={`checkbox${randId}`} className="customLabelOfCheckbox">
                {item.name === '' ? 'Введите значение' : item.name}
              </label>
            </div>
          );
        })}
        {context.labelRight !== '' && <label data-for={`input${id}`}>{context.labelRight}</label>}
        {(() => {
          switch (context.doPrint) {
            case 'print':
              return <PrintIcon color="primary" fontSize="small" />;
            case 'notPrint':
              return <PrintDisabledIcon color="primary" fontSize="small" />;
            default:
              return <FontDownloadIcon color="primary" fontSize="small" />;
          }
        })()}
      </div>
    </div>
  );
};

export default CustomCheckbox;
