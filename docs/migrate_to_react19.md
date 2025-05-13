# React Migration Guide: 18.2 → 18.3 → 19

This guide outlines the steps to migrate from React 18.2 to React 19, using React 18.3 as an intermediate step.

## Current Project Status

- React 18.2.0
- React DOM 18.2.0
- Next.js 15.2.4
- TypeScript with React types

## Migration Strategy Overview

1. Upgrade to React 18.3 first (preparation step)
2. Fix all deprecation warnings
3. Upgrade to React 19

## Step 1: Upgrade to React 18.3

React 18.3 is functionally identical to 18.2 but adds deprecation warnings for APIs that will be removed in React 19.

### Update Dependencies

```bash
npm install --save-exact react@18.3.0 react-dom@18.3.0
npm install --save-exact @types/react@18.2.64 @types/react-dom@18.2.21
```

### Run Codemods

React provides codemods to automatically fix many common issues:

```bash
npx codemod@latest react/19/migration-recipe
```

This will run codemods for:
- Replacing `ReactDOM.render`
- Replacing string refs
- Replacing act imports
- Replacing useFormState
- Converting PropTypes to TypeScript

### Address Deprecation Warnings

React 18.3 will show warnings for:

1. **String refs**
   ```jsx
   // Before
   class MyComponent extends React.Component {
     componentDidMount() {
       this.refs.input.focus();
     }
     render() {
       return <input ref='input' />;
     }
   }

   // After
   class MyComponent extends React.Component {
     componentDidMount() {
       this.input.focus();
     }
     render() {
       return <input ref={input => this.input = input} />;
     }
   }
   ```

2. **Legacy Context API**
   ```jsx
   // Before
   class Parent extends React.Component {
     static childContextTypes = {
       foo: PropTypes.string.isRequired,
     };
     getChildContext() {
       return { foo: 'bar' };
     }
     render() {
       return <Child />;
     }
   }

   // After
   const FooContext = React.createContext();
   class Parent extends React.Component {
     render() {
       return (
         <FooContext.Provider value='bar'>
           <Child />
         </FooContext.Provider>
       );
     }
   }
   ```

3. **ReactDOM Methods**
   ```jsx
   // Before
   import {render} from 'react-dom';
   render(<App />, document.getElementById('root'));

   // After
   import {createRoot} from 'react-dom/client';
   const root = createRoot(document.getElementById('root'));
   root.render(<App />);
   ```

4. **Function Component Patterns**
   ```jsx
   // Before
   function Heading({text}) {
     return <h1>{text}</h1>;
   }
   Heading.defaultProps = {
     text: 'Hello, world!',
   };

   // After
   function Heading({text = 'Hello, world!'}) {
     return <h1>{text}</h1>;
   }
   ```

## Step 2: Upgrade to React 19

Once all deprecation warnings are addressed:

### Update Dependencies

```bash
npm install --save-exact react@19.0.0 react-dom@19.0.0
npm install --save-exact @types/react@19.0.0 @types/react-dom@19.0.0
```

### Run TypeScript Codemods

```bash
npx types-react-codemod@latest preset-19 ./
```

For projects with many unsound accesses to `element.props`:

```bash
npx types-react-codemod@latest react-element-default-any-props ./
```

### Fix TypeScript Issues

1. **useRef requires an argument**
   ```tsx
   // Before
   const ref = useRef<HTMLDivElement>();

   // After
   const ref = useRef<HTMLDivElement>(null);
   ```

2. **Fix ref callback returns**
   ```tsx
   // Before
   <div ref={current => (instance = current)} />

   // After
   <div ref={current => {instance = current}} />
   ```

3. **JSX namespace changes**
   ```tsx
   // Before (global.d.ts)
   namespace JSX {
     interface IntrinsicElements {
       "my-element": {
         myElementProps: string;
       };
     }
   }

   // After (global.d.ts)
   declare module "react" {
     namespace JSX {
       interface IntrinsicElements {
         "my-element": {
           myElementProps: string;
         };
       }
     }
   }
   ```

## Breaking Changes in React 19

### Removed APIs

- `propTypes` and `defaultProps` for function components
- Legacy Context using `contextTypes` and `getChildContext`
- String refs
- Module pattern factories
- `React.createFactory`
- `react-test-renderer/shallow`
- `ReactDOM.render`, `ReactDOM.hydrate`, `unmountComponentAtNode`, `findDOMNode`
- Various test utilities

### Error Handling Changes

Errors in render are no longer re-thrown. To support custom error handling:

```jsx
const root = createRoot(container, {
  onUncaughtError: (error, errorInfo) => {
    // ... log error report
  },
  onCaughtError: (error, errorInfo) => {
    // ... log error report
  }
});
```

### New Features

1. **Ref as a Prop**: React 19 supports using `ref` as a regular prop
2. **StrictMode Improvements**: Better memoization during double rendering
3. **Suspense Improvements**: Faster fallback display
4. **Error Handling Improvements**: Reduced duplication of error logs

## Best Practices

1. **Incremental Approach**: First upgrade to 18.3, fix all warnings, then upgrade to 19
2. **Comprehensive Testing**: Test thoroughly after each step
3. **Use Codemods**: Leverage the provided codemods to automate changes
4. **Update Dependencies**: Check if UI libraries are compatible with React 19
5. **Review Error Handling**: React 19 changes how errors are handled
6. **TypeScript Updates**: Pay special attention to TypeScript changes
7. **New JSX Transform**: Ensure you're using the new JSX transform (required for React 19)

## Resources

- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19)
- [React Codemod Repository](https://github.com/reactjs/react-codemod)
- [TypeScript React Codemod](https://github.com/eps1lon/types-react-codemod/)
